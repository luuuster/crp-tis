/**
 * Gerador de Vagas — tela interna (wizard de 3 passos) com o copiloto "Charlie" num painel à direita.
 * Shell completo e autossuficiente: topbar (breadcrumb + tema/marca + "Falar com Charlie" + conta),
 * sidebar agrupada (Workspace/Pipeline) e rodapé de ações fixo. O briefing é um card único dividido em
 * seções numeradas, cada uma com STATUS REATIVO (Completa / Em revisão / A preencher) calculado dos campos.
 *
 * Abrir o Charlie recolhe o menu da esquerda (mutuamente exclusivos) — só um painel lateral por vez.
 * 100% token-driven (zero cor à mão) e multi-marca: cor, tipografia (.ty-*) e espaçamento vêm do
 * contrato CRP. A "chrome" de marca é SÓLIDA (sem gradiente): o menu, o avatar da conta e o ícone do
 * herói usam bg-primary/text-primary-foreground; a PERSONA do Charlie (CTA, avatares "C", ícones de
 * sugestão) usa bg-secondary/text-secondary-foreground — a 2ª cor da marca (roxo CRP / azul MarcaB).
 * Ambos os pares são AA garantidos pelo check.mjs e auditáveis por pixel. Demo sem backend: Charlie e
 * as ações apenas simulam; algumas sugestões do Charlie preenchem campos de verdade.
 *
 * Este arquivo guarda APENAS a PÁGINA: todo o estado de orquestração (step, data, perfil, screen…),
 * o shell (sidebar + topbar + rodapés) e o roteamento de `screen`. Os subcomponentes (formulários,
 * primitivos de campo, Charlie, revisão, modelo/validação) vivem em ./job-generator/*.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, ChevronLeft, Pencil, Rocket, Save, X } from 'lucide-react'

import type { Briefing, Perfil, Tom } from '@/lib/vaga'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { VagasList, VagaDetalhe, type Vaga } from './VagasList'
import { Sidebar, MobileNav, useIsMobile } from '@/components/shell/AppShell'
import {
  BriefingForm,
  CharlieRail,
  ConfirmDialog,
  PerfilForm,
  ReviewStep,
  Stepper,
  TopBar,
  type Suggestion,
  type Msg,
  type SetBriefing,
  type SetPerfil,
  BRIEFING_INICIAL,
  PERFIL_INICIAL,
  SECTIONS,
  PERFIL_SECTIONS,
  STEPS,
  isFilledVal,
  optLabeler,
  requiredBriefingOk,
  requiredPerfilOk,
} from './job-generator'

/* ────────────────────────────── página ────────────────────────────── */

export function JobGenerator({ onNavigate, brand, mode, onCycleBrand, onToggleMode }: {
  onNavigate?: (v: string) => void; brand?: string; mode?: string; onCycleBrand?: () => void; onToggleMode?: () => void
} = {}) {
  const { t } = useTranslation('gerador')
  const [step, setStep] = useState(1)
  const [data, setData] = useState<Briefing>(BRIEFING_INICIAL)
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL)
  const [tom, setTom] = useState<Tom>('Equilibrado')
  // Resumo PERSONALIZADO (edição manual ou "Melhorar com IA"). null = usa o texto automático do tom.
  const [resumoOverride, setResumoOverride] = useState<string | null>(null)
  // Navegação do shell (governada AQUI, não dentro do VagasList — senão o menu não controla o detalhe):
  // 'lista' = índice de vagas; 'detalhe' = uma vaga aberta (read-only); 'wizard' = o passo a passo.
  const [screen, setScreen] = useState<'lista' | 'detalhe' | 'wizard'>('lista')
  const [vagaSel, setVagaSel] = useState<Vaga | null>(null)
  // Vaga sendo EDITADA (null = criação do zero). Muda título/breadcrumb/CTA do wizard p/ "editar" vs "nova".
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null)
  const [leftExpanded, setLeftExpanded] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [charlieOpen, setCharlieOpen] = useState(false)
  const isMobile = useIsMobile()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [publishOpen, setPublishOpen] = useState(false)
  // Validação SOFT por etapa: quando o usuário tenta avançar com obrigatórios em branco, ligamos o
  // destaque desta etapa (não trava — ver `avancar`). Some sozinho conforme preenche (é reativo).
  const [showErrors, setShowErrors] = useState<Record<number, boolean>>({})

  const set: SetBriefing = (k, v) => setData((d) => ({ ...d, [k]: v }))
  const setPerf: SetPerfil = (k, v) => setPerfil((p) => ({ ...p, [k]: v }))

  // O tom reescreve o RESUMO automático; escolher um tom descarta o resumo personalizado (volta ao automático).
  const onTom = (t: Tom) => { setTom(t); setResumoOverride(null) }
  const voltar = () => setStep((s) => Math.max(1, s - 1))
  // Zera o wizard (sem navegar nem avisar) — base p/ entrar, recomeçar e voltar à lista.
  const resetWizard = () => { setData(BRIEFING_INICIAL); setPerfil(PERFIL_INICIAL); setResumoOverride(null); setTom('Equilibrado'); setShowErrors({}); setStep(1); setEditingVaga(null) }
  // Lista → wizard de CRIAÇÃO (do zero, editingVaga = null).
  const irParaWizard = () => { resetWizard(); setScreen('wizard') }
  // "Editar" abre o MESMO wizard, mas PREENCHIDO com a vaga e em modo edição (não a tela em branco).
  const editarVaga = (v: Vaga) => {
    setData(v.briefing); setPerfil(v.perfil); setResumoOverride(null); setTom('Equilibrado'); setShowErrors({}); setStep(1)
    setEditingVaga(v); setCharlieOpen(false); setScreen('wizard')
    toast.info(t('toast.editando', { cargo: v.briefing.cargo }))
  }
  // Lista → detalhe (clique na linha) e detalhe → editar.
  const verVaga = (v: Vaga) => { setCharlieOpen(false); setVagaSel(v); setScreen('detalhe') }
  const editarVagaSel = () => { if (vagaSel) editarVaga(vagaSel) }
  // Qualquer tela → lista (fecha o Charlie, zera o rascunho e descarta a vaga aberta). É o destino do menu "Vagas".
  const irParaLista = () => { resetWizard(); setCharlieOpen(false); setVagaSel(null); setScreen('lista') }
  // Cancelar a criação só executa após a confirmação na modal (volta à lista).
  const resetAll = () => { const editando = !!editingVaga; irParaLista(); toast.info(editando ? t('toast.edicaoCancelada') : t('toast.criacaoCancelada')) }
  // "Nova vaga" (no passo final): recomeça o wizard do zero, sem sair pra lista.
  const novaVaga = () => { resetWizard(); toast.success(t('toast.novaIniciada')) }

  // mutuamente exclusivos: expandir o menu fecha o Charlie; abrir o Charlie recolhe o menu.
  const setLeft = (v: boolean) => { setLeftExpanded(v); if (v) setCharlieOpen(false) }
  // hambúrguer: `< md` abre/fecha o DRAWER overlay; `≥ md` recolhe/expande a largura do menu fixo.
  const toggleMenu = () => {
    if (isMobile) { setMobileNavOpen((o) => !o); setCharlieOpen(false) }
    else setLeft(!leftExpanded)
  }
  // `open` do drawer é DERIVADO (isMobile && …): no desktop fica false sozinho — sem effect que sincronize
  // estado (evita render em cascata) e sem Radix prendendo foco num overlay invisível.
  const navOpen = isMobile && mobileNavOpen
  const openCharlie = () => {
    setCharlieOpen(true); setLeftExpanded(false); setMobileNavOpen(false)
    if (msgs.length === 0) {
      const at = Date.now()
      // nivel/modelo entram traduzidos na saudação (o valor canônico pt-BR segue no estado da vaga).
      setMsgs([{ id: at, role: 'assistant', at, text: t('charlie.saudacao', { nivel: optLabeler(t, 'nivel')(data.nivel), modelo: optLabeler(t, 'modelo')(data.modelo), local: data.local, budget: data.budget ? '' : t('charlie.saudacaoBudget') }) }])
    }
  }
  const toggleCharlie = () => (charlieOpen ? setCharlieOpen(false) : openCharlie())

  const pushPair = (userText: string, assistantText: string) => {
    const t = Date.now()
    setMsgs((m) => [...m, { id: t, role: 'user', text: userText, at: t }, { id: t + 1, role: 'assistant', text: assistantText, at: t }])
  }
  const onSend = (text: string) => pushPair(text, t('charlie.respostaPadrao'))
  const onSuggestion = (s: Suggestion) => pushPair(s.label, s.run({ data, set, perfil, setPerfil: setPerf }))

  // etapa "completa" = obrigatórios preenchidos. A etapa 3 (descrição) está pronta quando 1 e 2 estão.
  const stepComplete = (n: number) =>
    n === 1 ? requiredBriefingOk(data)
    : n === 2 ? requiredPerfilOk(perfil)
    : requiredBriefingOk(data) && requiredPerfilOk(perfil)
  const countMissing = (n: number) =>
    n === 1 ? SECTIONS.flatMap((s) => s.fields).filter((k) => !isFilledVal(data[k])).length
    : n === 2 ? PERFIL_SECTIONS.flatMap((s) => s.fields).filter((k) => !isFilledVal(perfil[k])).length
    : 0
  // Rola/foca o 1º campo destacado (qualquer controle com aria-invalid), após o render do destaque.
  const focusFirstInvalid = () => window.setTimeout(() => {
    const el = document.querySelector<HTMLElement>('[aria-invalid="true"],[data-invalid]')
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.() }
  }, 0)

  // "Resolver" (pendência do passo 4): vai ao passo, LIGA o destaque dos obrigatórios e rola até o 1º.
  const onResolve = (n: number) => { setStep(n); setShowErrors((p) => ({ ...p, [n]: true })); focusFirstInvalid() }

  // Validação SOFT: ao tentar avançar com obrigatórios em branco, DESTACA + avisa (com ação "avançar
  // assim mesmo") + foca o 1º, mas NÃO trava — um 2º clique (ou a ação do aviso) prossegue.
  const avancar = () => {
    if (step >= STEPS.length) { setPublishOpen(true); return }
    if ((step === 1 || step === 2) && !stepComplete(step) && !showErrors[step]) {
      setShowErrors((p) => ({ ...p, [step]: true }))
      toast.warning(t('validacao.obrigatoriosEmBranco', { count: countMissing(step) }), {
        description: t('validacao.obrigatoriosDescricao'),
        action: { label: t('validacao.avancarAssimMesmo'), onClick: () => setStep((s) => s + 1) },
      })
      focusFirstInvalid()
      return
    }
    setStep((s) => s + 1)
  }
  // Modo edição muda os rótulos finais. Editar uma vaga JÁ publicada → "Republicar vaga" (salva + republica);
  // editar um RASCUNHO → ainda é a 1ª publicação ("Publicar vaga"), e só aí faz sentido "Salvar rascunho".
  const isEditing = !!editingVaga
  const editingDraft = editingVaga?.status === 'Rascunho'
  const republicar = isEditing && !editingDraft
  const finalCtaLabel = republicar ? t('footer.republicarVaga') : t('footer.publicarVaga')
  // O eyebrow do próximo passo, traduzido e minúsculo (mantém o byte-idêntico "Avançar para …" por idioma).
  const nextLabel = step >= STEPS.length ? finalCtaLabel : t('footer.avancarPara', { etapa: t(`steps.${(step + 1) as 1 | 2 | 3}.eyebrow`).toLowerCase() })
  // Rótulo da página atual no breadcrumb (vale p/ detalhe e wizard; na lista o TopBar ignora).
  const crumbLabel = screen === 'detalhe' ? (vagaSel?.briefing.cargo ?? t('crumb.vaga'))
    : editingVaga ? t('crumb.editar', { cargo: editingVaga.briefing.cargo })
    : t('crumb.novaVaga')

  return (
    <div className="ty-scale-16 flex h-dvh overflow-hidden bg-muted/40 text-foreground">
      <Sidebar active="gerador" expanded={leftExpanded} onNavigate={onNavigate} onVagas={irParaLista} />
      <MobileNav active="gerador" open={navOpen} onOpenChange={setMobileNavOpen} onNavigate={onNavigate} onVagas={irParaLista} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onToggleMenu={toggleMenu} menuExpanded={isMobile ? mobileNavOpen : leftExpanded} isMobile={isMobile} onCharlie={toggleCharlie} charlieOpen={charlieOpen} onLogout={() => onNavigate?.('login')} brand={brand} mode={mode} onCycleBrand={onCycleBrand} onToggleMode={onToggleMode} screen={screen} crumbLabel={crumbLabel} onBackToList={irParaLista} />

        {/* relative: ancora os filhos `sr-only` (position:absolute) AQUI, senão eles escapam p/ o <html>
            e esticam o documento (espaço em branco rolável abaixo do app). */}
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          {screen === 'lista' && <VagasList onAbrirVaga={irParaWizard} onEditVaga={editarVaga} onVerVaga={verVaga} />}
          {screen === 'detalhe' && vagaSel && <VagaDetalhe vaga={vagaSel} />}
          {screen === 'wizard' && (
            <div className="mx-auto max-w-5xl space-y-7 px-5 py-8 lg:px-8">
              <header className="space-y-3">
                <p className="ty-overline text-muted-foreground">{t('header.etapaLinha', { modo: isEditing ? t('header.eyebrowEdicao') : t('header.eyebrowCriacao'), num: String(step).padStart(2, '0'), eyebrow: t(`steps.${step as 1 | 2 | 3}.eyebrow`) })}</p>
                <h1 className="font-heading text-3xl font-bold tracking-tight">{isEditing ? t('header.tituloEditar') : t('header.tituloNova')}</h1>
                {isEditing
                  ? <p className="max-w-2xl ty-body text-muted-foreground">{t('header.descEditarAntes')}<span className="font-medium text-foreground">{editingVaga.briefing.cargo}</span>{t('header.descEditarDepois')}</p>
                  : <p className="max-w-2xl ty-body text-muted-foreground">{t('header.descNova')}</p>}
              </header>

              <Separator />

              <Stepper step={step} onPick={setStep} complete={stepComplete} />

              {step === 1 && <BriefingForm data={data} set={set} showErrors={!!showErrors[1]} />}
              {step === 2 && <PerfilForm perfil={perfil} set={setPerf} showErrors={!!showErrors[2]} />}
              {step === 3 && <ReviewStep data={data} perfil={perfil} tom={tom} onTom={onTom} set={set} resumoOverride={resumoOverride} onResumoChange={setResumoOverride} onResolve={onResolve} onPublish={avancar} onNova={novaVaga} ctaLabel={finalCtaLabel} />}
            </div>
          )}
        </main>

        {/* rodapé de ações — só no wizard (na lista as ações vivem na própria tela) */}
        {screen === 'wizard' && (
        <footer className="border-t border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl flex-col gap-2.5 px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 lg:px-8">
            <div className="flex items-center gap-2">
              <ConfirmDialog
                trigger={<Button variant="destructive-outline" className="max-sm:flex-1"><X /> {isEditing ? t('footer.cancelarEdicao') : t('footer.cancelarCriacao')}</Button>}
                icon={AlertTriangle} tone="destructive"
                title={isEditing ? t('dialog.cancelarEdicaoTitulo') : t('dialog.cancelarCriacaoTitulo')}
                description={isEditing ? t('dialog.cancelarEdicaoDescricao') : t('dialog.cancelarCriacaoDescricao')}
                cancelLabel={t('dialog.continuarEditando')} confirmLabel={t('dialog.simCancelar')} confirmVariant="destructive" onConfirm={resetAll}
              />
              {/* "Salvar rascunho" só faz sentido criando OU editando uma vaga que ainda é rascunho. */}
              {(!isEditing || editingDraft) && (
                <ConfirmDialog
                  trigger={<Button variant="ghost" className="bg-secondary/10 text-secondary-text hover:bg-secondary/15 hover:text-secondary-text max-sm:flex-1"><Save /> {t('footer.salvarRascunho')}</Button>}
                  icon={Save} tone="secondary"
                  title={t('dialog.salvarRascunhoTitulo')}
                  description={t('dialog.salvarRascunhoDescricao')}
                  cancelLabel={t('footer.voltar')} confirmLabel={t('dialog.salvarRascunhoConfirmar')} confirmVariant="secondary" onConfirm={() => toast.success(t('toast.rascunhoSalvo'))}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {step > 1 && <Button variant="ghost" onClick={voltar} className="max-sm:flex-1"><ChevronLeft /> {t('footer.voltar')}</Button>}
              {/* Último passo: publicar vive na coluna de Ações (desktop); no mobile fica AQUI no rodapé fixo. */}
              {step < STEPS.length && <Button onClick={avancar} className="max-sm:flex-1">{nextLabel} <ArrowRight /></Button>}
              {step === STEPS.length && <Button onClick={avancar} className="max-sm:flex-1 lg:hidden"><Rocket /> {finalCtaLabel}</Button>}
            </div>
          </div>
        </footer>
        )}

        {/* rodapé de ações do DETALHE — mesmo slot/estilo do rodapé do wizard. */}
        {screen === 'detalhe' && (
        <footer className="border-t border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3 lg:px-8">
            <Button variant="ghost" onClick={irParaLista} className="max-sm:flex-1"><ChevronLeft /> {t('footer.voltarLista')}</Button>
            <Button onClick={editarVagaSel} className="max-sm:flex-1"><Pencil /> {t('footer.editarVaga')}</Button>
          </div>
        </footer>
        )}

        {/* Confirmação final (controlada — abre pelo botão primário na última etapa). Republicar vs publicar. */}
        <ConfirmDialog
          open={publishOpen} onOpenChange={setPublishOpen}
          icon={Rocket} tone="primary"
          title={republicar ? t('dialog.republicarTitulo') : t('dialog.publicarTitulo')}
          description={republicar ? t('dialog.republicarDescricao') : isEditing ? t('dialog.publicarEdicaoDescricao') : t('dialog.publicarDescricao')}
          cancelLabel={t('dialog.revisarAntes')} confirmLabel={finalCtaLabel} confirmVariant="default" onConfirm={() => { toast.success(republicar ? t('toast.vagaRepublicada') : t('toast.vagaPublicada')); irParaLista() }}
        />
      </div>

      {screen === 'wizard' && <CharlieRail open={charlieOpen} onClose={() => setCharlieOpen(false)} step={step} msgs={msgs} onSuggestion={onSuggestion} onSend={onSend} onClear={() => setMsgs([])} />}
    </div>
  )
}
