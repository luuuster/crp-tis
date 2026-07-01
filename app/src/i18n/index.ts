/**
 * i18n (react-i18next) — pt-BR (padrão/fonte) + en + es. Só CHROME de UI: navegação, botões, rótulos,
 * status, estados vazios, toasts e validações. A prosa mockada (análises da IA, bios) NÃO é traduzida.
 * O idioma é persistido em `crp.locale` (espelha `crp.brand`/`crp.mode` do App) e reflete em `<html lang>`.
 * Recursos ESTÁTICOS + `useSuspense:false`: a tradução é síncrona (sem flicker/Suspense). Tipagem em ./i18next.d.ts.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ptCommon from './locales/pt-BR/common.json'
import ptNav from './locales/pt-BR/nav.json'
import ptAuth from './locales/pt-BR/auth.json'
import ptDashboard from './locales/pt-BR/dashboard.json'
import ptVagas from './locales/pt-BR/vagas.json'
import ptUsuarios from './locales/pt-BR/usuarios.json'
import ptCandidatos from './locales/pt-BR/candidatos.json'
import ptEntrevistasIa from './locales/pt-BR/entrevistas-ia.json'
import ptEntrevistas from './locales/pt-BR/entrevistas.json'
import ptGerador from './locales/pt-BR/gerador.json'
import ptPipeline from './locales/pt-BR/pipeline.json'
import ptInscricao from './locales/pt-BR/inscricao.json'
import ptAcesso from './locales/pt-BR/acesso.json'
import ptPainel from './locales/pt-BR/painel.json'
import ptPerfil from './locales/pt-BR/perfil.json'
import ptAgendamento from './locales/pt-BR/agendamento.json'
import enCommon from './locales/en/common.json'
import enNav from './locales/en/nav.json'
import enAuth from './locales/en/auth.json'
import enDashboard from './locales/en/dashboard.json'
import enVagas from './locales/en/vagas.json'
import enUsuarios from './locales/en/usuarios.json'
import enCandidatos from './locales/en/candidatos.json'
import enEntrevistasIa from './locales/en/entrevistas-ia.json'
import enEntrevistas from './locales/en/entrevistas.json'
import enGerador from './locales/en/gerador.json'
import enPipeline from './locales/en/pipeline.json'
import enInscricao from './locales/en/inscricao.json'
import enAcesso from './locales/en/acesso.json'
import enPainel from './locales/en/painel.json'
import enPerfil from './locales/en/perfil.json'
import enAgendamento from './locales/en/agendamento.json'
import esCommon from './locales/es/common.json'
import esNav from './locales/es/nav.json'
import esAuth from './locales/es/auth.json'
import esDashboard from './locales/es/dashboard.json'
import esVagas from './locales/es/vagas.json'
import esUsuarios from './locales/es/usuarios.json'
import esCandidatos from './locales/es/candidatos.json'
import esEntrevistasIa from './locales/es/entrevistas-ia.json'
import esEntrevistas from './locales/es/entrevistas.json'
import esGerador from './locales/es/gerador.json'
import esPipeline from './locales/es/pipeline.json'
import esInscricao from './locales/es/inscricao.json'
import esAcesso from './locales/es/acesso.json'
import esPainel from './locales/es/painel.json'
import esPerfil from './locales/es/perfil.json'
import esAgendamento from './locales/es/agendamento.json'

export const LOCALES = ['pt-BR', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const LOCALE_LABEL: Record<Locale, string> = { 'pt-BR': 'Português', en: 'English', es: 'Español' }

// pt-BR é a árvore de referência (a tipagem deriva dela — ver i18next.d.ts).
export const resources = {
  'pt-BR': { common: ptCommon, nav: ptNav, auth: ptAuth, dashboard: ptDashboard, vagas: ptVagas, usuarios: ptUsuarios, candidatos: ptCandidatos, 'entrevistas-ia': ptEntrevistasIa, entrevistas: ptEntrevistas, gerador: ptGerador, pipeline: ptPipeline, inscricao: ptInscricao, acesso: ptAcesso, painel: ptPainel, perfil: ptPerfil, agendamento: ptAgendamento },
  en: { common: enCommon, nav: enNav, auth: enAuth, dashboard: enDashboard, vagas: enVagas, usuarios: enUsuarios, candidatos: enCandidatos, 'entrevistas-ia': enEntrevistasIa, entrevistas: enEntrevistas, gerador: enGerador, pipeline: enPipeline, inscricao: enInscricao, acesso: enAcesso, painel: enPainel, perfil: enPerfil, agendamento: enAgendamento },
  es: { common: esCommon, nav: esNav, auth: esAuth, dashboard: esDashboard, vagas: esVagas, usuarios: esUsuarios, candidatos: esCandidatos, 'entrevistas-ia': esEntrevistasIa, entrevistas: esEntrevistas, gerador: esGerador, pipeline: esPipeline, inscricao: esInscricao, acesso: esAcesso, painel: esPainel, perfil: esPerfil, agendamento: esAgendamento },
} as const

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v)
}

function storedLocale(): Locale {
  try {
    const v = localStorage.getItem('crp.locale')
    return isLocale(v) ? v : 'pt-BR'
  } catch {
    return 'pt-BR'
  }
}

void i18n.use(initReactI18next).init({
  resources,
  lng: storedLocale(),
  fallbackLng: 'pt-BR',
  defaultNS: 'common',
  ns: ['common', 'nav', 'auth', 'dashboard', 'vagas', 'usuarios', 'candidatos', 'entrevistas-ia', 'entrevistas', 'gerador', 'pipeline', 'inscricao', 'acesso', 'painel', 'perfil', 'agendamento'],
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
})

if (typeof document !== 'undefined') document.documentElement.lang = storedLocale()

// Troca o idioma: i18next + persistência + atributo lang do <html>. Reaproveitado pelo seletor.
export function setLocale(l: Locale) {
  void i18n.changeLanguage(l)
  try {
    localStorage.setItem('crp.locale', l)
  } catch {
    /* storage indisponível — segue sem persistir */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = l
}

export default i18n
