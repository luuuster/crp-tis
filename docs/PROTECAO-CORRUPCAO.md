# Proteção contra corrupção do working tree

> **ERRATA (2026-06-10, fim do dia) — causa identificada, e NÃO era o disco.**
> Teste definitivo: o mesmo arquivo, lido no mesmo instante, estava **completo no disco real
> (Windows)** e **truncado na visão do sandbox Linux** da ferramenta de auditoria (Cowork).
> Ou seja: **os arquivos do repositório nunca estiveram corrompidos** — a "corrupção" relatada nas
> auditorias rev. 2/rev. 3 (achado #1) era a camada de sincronização host→sandbox lendo versões
> parciais de arquivos recém-escritos. Isso é consistente com todos os sintomas: commits sempre
> íntegros, `git status` local limpo, build local verde. As "restaurações" executadas escreveram
> conteúdo idêntico ao HEAD e foram inofensivas.
> As proteções abaixo permanecem instaladas como **seguro barato** contra corrupção real (custo ~0;
> na sua máquina o doctor simplesmente reporta "íntegro"), e a recomendação sobre OneDrive vira
> opcional — não é mais a suspeita principal.

## O que aconteceu

Em 2026-06-10 o working tree **aparentou** corromper **duas vezes** (19 e depois 26 arquivos),
sempre com a mesma assinatura: arquivo **truncado** (cortado no meio de palavra), às vezes com
**padding de espaços** no fim ou **bytes NUL** — e sempre em arquivos **recém-escritos**. O conteúdo
commitado no git permaneceu íntegro nas duas ocorrências. Ver errata acima: a causa era a visão do
sandbox, não o disco.

## As 3 camadas de defesa (instaladas)

**1. `npm run doctor` — diagnóstico.** Compara o disco com o HEAD e separa *corrupção* (assinatura
de truncamento/NUL) de *edição legítima* (que ele nunca toca). Sai com código 1 se houver corrupção.

**2. `npm run doctor:fix` — restauração.** Sobrescreve só os corrompidos com o conteúdo do HEAD,
in-place (funciona mesmo quando `git restore` falha com EPERM), e re-verifica.

**3. Hook `pre-commit` — trava de segurança.** Bloqueia o commit se houver corrupção no disco,
impedindo o cenário catastrófico: gravar a versão quebrada por cima da boa no git.
**Instalação (uma vez por máquina):**

```bash
git config core.hooksPath .githooks
```

## A correção DEFINITIVA (ação manual, fora do repo)

As camadas acima detectam, restauram e bloqueiam o dano — mas não eliminam a causa. Para isso:

1. Verifique se `C:\Users\frank\Videos` está sob sync: OneDrive → Configurações →
   Sincronização e backup → Gerenciar backup (e também ícones de nuvem/status nos arquivos do repo
   no Explorer).
2. Se estiver: **mova o repositório para fora de qualquer pasta sincronizada** — ex.: `C:\dev\crp_ds`.
   Repositório git dentro de pasta com sync de nuvem é causa conhecida exatamente deste sintoma
   (placeholder/upload parcial durante escrita).
   - Alternativa mais fraca: marcar a pasta como "Sempre manter neste dispositivo" e **excluir o
     diretório do repo da sincronização** — reduz, mas não zera o risco.
3. Antivírus: adicione a pasta do repo às exclusões de varredura em tempo real, se houver AV de
   terceiros.

## Rotina recomendada

- Commits frequentes continuam sendo a melhor proteção (foram o que salvou o projeto 2×).
- Se o `git status` mostrar arquivo modificado que você não editou → `npm run doctor` antes de
  qualquer commit.
- O hook faz isso automaticamente em todo commit depois do `git config` acima.
