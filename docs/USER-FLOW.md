# User Flow — TalentAI (crp_ds)

> O **caminho de ponta a ponta** da plataforma, da criação da vaga à contratação — com pontos de decisão,
> bifurcações que reconvergem e estados finais. É o complemento da
> [Arquitetura de Informação](./ARQUITETURA-INFORMACAO.md): a IA mostra **como o conteúdo se organiza**
> (site map); o User Flow mostra **o caminho que a pessoa percorre**.

> 📄 Espelho textual da tela `app/src/pages/UserFlow.tsx` (app de documentação, `:5174`, rota `/userflow`).
> Mockup sem backend · multi-marca (CRP / Trevo) × claro/escuro · i18n pt-BR/en/es · WCAG 2.2 AA.
> _Otimizado para Azure DevOps Wiki: blocos `::: mermaid` e sumário automático `[[_TOC_]]`._

[[_TOC_]]

---

## Atores

| Cor | Ator | No fluxo |
|:---:|------|----------|
| 🟦 | **Recrutador / IA** | Cria, revisa e publica a vaga; conduz o funil |
| 🟪 | **Candidato** | Encontra a vaga, candidata-se e avança nas etapas |
| 🟨 | **Publicação / decisão** | Pontos de bifurcação e estados de transição |
| 🟥 | **Reprovado (fim)** | Saída negativa do funil |
| 🟩 | **Contratado (fim)** | Saída positiva |

> ℹ️ Em tela, a cor **nunca** é o único sinal — sempre acompanha rótulo + ícone (acessibilidade).

---

## 1. Fluxo completo — da vaga à contratação

Três fases: **criação/publicação** (recrutador) → **acesso/candidatura** (candidato) → **funil de 5 etapas**
(IA → RH → Teste → Gestor → Proposta). Cada porta do funil pode reprovar.

::: mermaid
graph TD
    subgraph F1["Fase 1 · Criacao e publicacao (recrutador)"]
        Login(["Recrutador faz login"]) --> Brief["Cria a vaga · resumo"]
        Brief --> Perfil["Define o perfil da vaga"]
        Perfil --> Revisa["Revisa · Charlie melhora a postagem<br/>ou muda o tom de voz"]
        Revisa --> Pub{"Publicar agora?"}
        Pub -->|Nao| Rascunho["Salvo como rascunho"]
        Rascunho -.completa e publica depois.-> Pub
        Pub -->|Sim| Ativa[("Vaga publicada · ativa com prazo<br/>LinkedIn e sites")]
    end

    subgraph F2["Fase 2 · Acesso e candidatura (candidato)"]
        Abre["Candidato abre a vaga<br/>link publico ou pelo mural"] --> Conta{"Ja tem conta?"}
        Conta -->|Nao| FormPub["Formulario publico · cria conta"]
        Conta -->|Sim| Modal["Confirma no modal · logado"]
        FormPub --> Inscr["Inscricao enviada"]
        Modal --> Inscr
        Inscr --> Quest["Responde o questionario · 2a etapa"]
    end

    subgraph F3["Fase 3 · Triagem e selecao (funil de 5 etapas)"]
        IA{"IA aprova?"} -->|Nao| RepIA["Reprovado pela IA"]
        IA -->|Sim| Agenda["Candidato agenda a entrevista<br/>escolhe dias e horarios"]
        Agenda --> Marcada["Entrevista marcada"]
        Marcada --> Comp{"Entrevistadores<br/>podem comparecer?"}
        Comp -->|Nao| Reag["Imprevisto interno → RH reagenda<br/>nos mesmos horarios · avisa e-mail + WhatsApp"]
        Reag --> Marcada
        Comp -->|Sim| RH["Entrevista com o RH"]
        RH --> RHok{"RH aprova?"}
        RHok -->|Nao| RepRH["Reprovado no RH"]
        RHok -->|Sim| Teste["Teste tecnico / case"]
        Teste --> Tok{"Passa no teste?"}
        Tok -->|Nao| RepT["Reprovado no teste"]
        Tok -->|Sim| Gestor["Entrevista com o gestor"]
        Gestor --> Gok{"Gestor aprova?"}
        Gok -->|Nao| RepG["Reprovado pelo gestor"]
        Gok -->|Sim| Proposta["Proposta enviada"]
        Proposta --> Aceita{"Candidato aceita?"}
        Aceita -->|Nao| Rec["Proposta recusada"]
    end

    Ativa --> Abre
    Quest --> IA
    Aceita -->|Sim| Contratado(["Contratado 🎉"])

    classDef fim fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d;
    classDef ok fill:#dcfce7,stroke:#15803d,color:#14532d;
    classDef warn fill:#fef3c7,stroke:#b45309,color:#7c2d12;
    class RepIA,RepRH,RepT,RepG,Rec fim;
    class Contratado ok;
    class Rascunho,Reag warn;
:::

> 🤖 **Charlie (copiloto de IA)** participa de **todos** os passos da criação da vaga — sugere e preenche em
> cada etapa (resumo da vaga, perfil, revisão) e, no fim, ainda melhora a postagem ou muda o **tom de voz**
> (Equilibrado · Descontraído · Formal).

### As 3 fases em resumo

| Fase | Quem | Do quê ao quê |
|------|------|---------------|
| **1 · Criação e publicação** | Recrutador (+ Charlie) | Login → resumo da vaga → perfil → revisão → **publicar** ou **rascunho** |
| **2 · Acesso e candidatura** | Candidato | Abre a vaga → (público × logado) → inscrição → questionário (2ª etapa) |
| **3 · Triagem e seleção** | IA + RH + Gestor | Funil de 5 portas — cada uma pode reprovar — até **Contratado** |

### Pontos de decisão (e o caminho do "Não")

| Decisão | Caminho do **Não** |
|---------|--------------------|
| Publicar agora? | Salvo como **rascunho** (completa e publica depois) |
| Já tem conta? | **Formulário público** (cria conta) em vez do modal logado |
| IA aprova? | Reprovado pela IA · _fim_ |
| Entrevistadores podem comparecer? | Imprevisto interno → **RH reagenda** nos mesmos horários, avisa por **e-mail + WhatsApp** |
| RH aprova? | Reprovado no RH · _fim_ |
| Passa no teste? | Reprovado no teste · _fim_ |
| Gestor aprova? | Reprovado pelo gestor · _fim_ |
| Candidato aceita? | Proposta recusada · _fim_ |

---

## 2. Acesso do candidato

Como o candidato entra na plataforma — cadastro, login, 1º acesso e **recuperação de senha**. Cada passo da
recuperação tem **rota própria** (deep-link + botão voltar do navegador).

::: mermaid
graph LR
    Cad["/cadastro"] -->|cria conta| Acesso["/acesso · login"]

    Acesso -->|conta cadastrada| P1["/painel"]
    Acesso -->|senha provisoria · 1o acesso| Troca["Trocar a senha"]
    Troca --> P2["/painel"]
    Acesso -->|senha incorreta| Erro["Erro — tenta de novo"]

    Acesso -->|esqueceu a senha| R1["/acesso/recuperar<br/>informa o e-mail"]
    R1 -->|envia link| R2["/acesso/recuperar/enviado"]
    R2 -.abre o link do e-mail.-> R3["/redefinir_senha<br/>cria a nova senha"]
    R3 --> R4["/redefinir_senha/sucesso"]
    R4 --> P3["/painel"]

    classDef fim fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d;
    classDef ok fill:#dcfce7,stroke:#15803d,color:#14532d;
    classDef warn fill:#fef3c7,stroke:#b45309,color:#7c2d12;
    class P1,P2,P3,R4 ok;
    class Troca,R3 warn;
    class Erro fim;
:::

| Condição no login | Caminho |
|-------------------|---------|
| **Conta cadastrada** | Entra direto no `/painel` |
| **Senha provisória · 1º acesso** | Troca obrigatória de senha → `/painel` |
| **Esqueceu a senha** | `/acesso/recuperar` → `/acesso/recuperar/enviado` → `/redefinir_senha` → `/redefinir_senha/sucesso` → `/painel` |
| **Senha incorreta** | Erro — tenta de novo (o erro some ao editar qualquer campo) |

> ♿ **Acessibilidade do fluxo:** a cada troca de etapa o foco vai para o título da tela, para o leitor de
> tela anunciar a mudança de contexto. As 4 telas novas têm cobertura automatizada de _axe_ (0 violações).

---

## 3. Ciclo de vida da vaga

Estados da vaga no sistema (estado de origem → transições), do rascunho ao encerramento.

::: mermaid
stateDiagram-v2
    [*] --> Rascunho
    Rascunho --> Ativa: publicar
    Ativa --> Expirada: prazo expira
    Ativa --> Fechada: fechar manualmente
    Expirada --> Ativa: editar e republicar (novo prazo)
    Fechada --> Ativa: editar e republicar (novo prazo)
    Ativa --> [*]
:::

| Estado | Como chega | Saídas |
|--------|-----------|--------|
| **Rascunho** | Recrutador salva sem publicar (completa depois) | → _publicar_ → **Ativa** |
| **Ativa · prazo definido** | Publicação (prazo padrão 30 dias) | → _prazo expira_ → **Expirada** · → _fechar manualmente_ → **Fechada** |
| **Expirada** | Prazo acabou | → _editar e republicar_ → **Ativa** (novo prazo) |
| **Fechada** | Recrutador encerrou | → _editar e republicar_ → **Ativa** (novo prazo) |

---

## Notas do fluxo

- O funil de 5 etapas (Análise IA → RH → Teste → Gestor → Proposta) é o mesmo no **Funil** (kanban) e no
  **Banco de talentos** (stepper do processo).
- A entrevista é **agendada pelo candidato** (escolhe dias e horários); só o **RH** pode reagendar, avisando
  por e-mail + WhatsApp.
- O **Charlie** acompanha toda a criação da vaga e ainda ajusta o tom de voz da postagem.
