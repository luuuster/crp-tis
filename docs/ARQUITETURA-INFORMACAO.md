# Arquitetura de Informação — TalentAI (crp_ds)

> Mapa visual da **plataforma inteira**: o app do **recrutador** (porta dev `:5173`) e o app do
> **candidato** (porta dev `:5172`). Mesma plataforma, mesmo Design System / tokens / i18n — duas
> origens separadas porque atendem públicos diferentes (o "lado de dentro" e o "lado de fora").
>
> Mockup de propósito: sem backend. As rotas do candidato são por `pathname`; as "rotas" do
> recrutador são `views` em abas (estado em `localStorage:crp.view`).

---

## 1. Visão geral — o ciclo de valor

O recrutador **cria e publica** a vaga; o candidato a **encontra e se candidata**; a candidatura
**volta** para o funil de triagem do recrutador. É um loop entre os dois apps.

```mermaid
graph TB
    subgraph REC["🧑‍💼 App do Recrutador · :5173"]
        RLogin["🔐 Login"] -->|autentica| RWork["Workspace<br/>(área logada)"]
    end

    subgraph CAND["🧑‍🎓 App do Candidato · :5172"]
        CAcesso["/acesso · login"] -->|sessão| CPainel["/painel<br/>mural de vagas"]
        CCad["/cadastro"] --> CAcesso
        CPub["Link público da vaga<br/>(LinkedIn etc.)"] -.->|sem login| CVaga["Página da vaga"]
        CPainel -->|abre em nova aba| CVaga
    end

    RWork -->|publica| VAGA[("📢 Vaga publicada")]
    VAGA --> CPainel
    VAGA --> CPub
    CVaga -->|candidatura + 2ª etapa| POOL[("📨 Candidatura")]
    POOL -->|entra na triagem| RWork

    classDef gate fill:#fde68a,stroke:#b45309,color:#7c2d12;
    classDef store fill:#e0e7ff,stroke:#4338ca,color:#312e81;
    class RLogin,CAcesso gate;
    class VAGA,POOL store;
```

---

## 2. App do Recrutador (`:5173`)

Login → Workspace. A navegação é por abas (`App.tsx`). Menu agrupado em **Workspace** e **Sistema**
(rótulos exatos de `i18n/nav.json`).

```mermaid
graph TB
    Login["🔐 Login"]

    subgraph WS["Workspace"]
        DASH["📊 Dashboard"]
        VAGAS["📋 Vagas"]
        EIA["🤖 Entrevistas IA"]
        CAL["📅 Calendário de entrevistas"]
        BANCO["👥 Banco de talentos"]
        FUNIL["🗂️ Funil de contratação"]
    end

    subgraph SIS["Sistema"]
        USERS["⚙️ Usuários"]
        COMP["🧩 Componentes"]
    end

    Login -->|entra| DASH

    %% Dashboard
    DASH --> DBlocos["KPIs · gráfico de status · linha de inscritos<br/>tabela de últimas entrevistas · modo personalizar"]

    %% Vagas (JobGenerator)
    VAGAS --> VLista["Lista de vagas<br/>busca · cards"]
    VLista --> VDet["Detalhe da vaga (read-only)"]
    VDet --> VEdit["Editar"]
    VLista --> VNova["➕ Nova vaga (wizard)"]
    VNova --> W1["1 · Resumo da vaga"] --> W2["2 · Perfil"] --> W3["3 · Revisar e publicar"]
    W3 -->|publica| VPub[("📢 Vaga publicada")]

    %% Entrevistas IA (triagem)
    EIA --> EIATab["Tabela de candidatos<br/>pendente · aprovado bot · aprovado RH · reprovado"]
    EIATab --> EIADet["Detalhe (Sheet)<br/>aderência % · score · avaliações · pontos fortes · perguntas"]

    %% Calendário
    CAL --> CalAg["Agendar entrevista<br/>candidato · vaga · data/hora · formato · entrevistadores"]
    CAL --> CalProx["Próximas entrevistas"]
    CAL --> CalFila["Aguardando agendamento"]

    %% Banco de talentos
    BANCO --> BPerfil["Perfil do candidato (Sheet)<br/>histórico de processos"]
    BPerfil --> BProc["Detalhe do processo · stepper"]

    %% Funil
    FUNIL --> FKanban["Kanban · 5 colunas"]
    FKanban --> FCard["Detalhe do card · stepper<br/>aprovar/reprovar move o card"]

    %% Etapas do funil (compartilhadas entre Funil e Banco de talentos)
    FASES["Etapas do processo:<br/>1 Análise IA · 2 RH · 3 Teste · 4 Gestor · 5 Proposta"]
    BProc -.-> FASES
    FCard -.-> FASES

    %% Usuários
    USERS --> UCrud["Lista + filtros · criar · editar · desativar"]

    %% Componentes
    COMP --> CGal["Galeria do DS<br/>componentes · tokens · a11y · marca/tema"]

    classDef gate fill:#fde68a,stroke:#b45309,color:#7c2d12;
    classDef store fill:#e0e7ff,stroke:#4338ca,color:#312e81;
    classDef note fill:#f1f5f9,stroke:#64748b,color:#334155;
    class Login gate;
    class VPub store;
    class FASES note;
```

---

## 3. App do Candidato (`:5172`)

Rotas por `pathname` (`CandidatoApp.tsx`): `/acesso`, `/cadastro`, `/painel` e o resto cai na
**página da vaga**. A 2ª etapa e as abas Descrição/Inscrição são estados internos (a URL é
sincronizada via History API).

```mermaid
graph TB
    subgraph ENTRADA["Entrada"]
        Cadastro["/cadastro<br/>nome · e-mail · senha · CV"] --> Acesso
        Acesso["/acesso · login<br/>(senha provisória)"] --> Troca["Trocar senha (1º acesso)"]
        Acesso -.->|esqueci a senha| Recuperar["/acesso/recuperar<br/>informa o e-mail"]
        Recuperar --> Enviado["/acesso/recuperar/enviado<br/>link de recuperação enviado"]
        Enviado -.->|abre o link do e-mail| Redefinir["/redefinir_senha<br/>cria a nova senha"]
        Redefinir --> RedefinidoOk["✅ /redefinir_senha/sucesso<br/>senha redefinida"]
        LinkPub["🔗 Link público da vaga"]
    end

    Acesso -->|sessão| Painel
    Troca -->|sessão| Painel["/painel · mural de vagas<br/>busca · filtros · ordenação · cards · paginação"]
    RedefinidoOk -->|sessão| Painel

    subgraph PAGINA["/descricao_da_vaga?vaga=ID"]
        Vaga["Página da vaga"] --> AbaDesc["Aba · Descrição<br/>documento da vaga + sobre a empresa"]
        AbaDesc <-->|alterna · URL sincronizada| AbaInscr["Aba · Inscrição"]
    end

    Painel -->|clica no card · nova aba| Vaga
    LinkPub -.->|deslogado| Vaga

    AbaInscr -->|deslogado| Form["Formulário público<br/>nome · CPF · e-mail · tel · CV · captcha"]
    AbaInscr -->|logado| Modal["Modal · Confirmar candidatura<br/>(currículo do perfil ou outro)"]

    Form --> Sucesso["✅ Candidatura enviada"]
    Modal --> Sucesso
    Sucesso -->|continuar| Seg["2ª etapa · questionário<br/>perguntas abertas + captcha"]
    Sucesso -->|logado · ver mais vagas| Painel
    Seg --> SegOk["✅ Questionário enviado"]
    SegOk -->|voltar ao mural| Painel

    classDef gate fill:#fde68a,stroke:#b45309,color:#7c2d12;
    classDef done fill:#dcfce7,stroke:#15803d,color:#14532d;
    class Acesso,Troca,Recuperar,Enviado,Redefinir gate;
    class Sucesso,SegOk,RedefinidoOk done;
```

### Chrome por área
- **Telas públicas** (vaga, 2ª etapa): header leve (logo) + dock flutuante (idioma / marca / tema).
  Com sessão, o logo vira link para `/painel` e aparece a conta (avatar + sair).
- **Área logada** (`/painel`): topbar própria (logo + idioma/marca/tema + conta).

---

## 4. A jornada completa (da criação à contratação)

O funil de ponta a ponta, cruzando recrutador → publicação externa → candidato → triagem por IA → RH.

```mermaid
graph LR
    S1["📝 Recrutador<br/>cria a vaga"] --> S2[("📢 Publicada no<br/>LinkedIn / sites")]
    S2 --> S3["📨 Candidato<br/>se inscreve"]
    S3 --> S4["🧠 Responde o<br/>questionário (2ª etapa)"]
    S4 --> S5["🤖 IA aprova<br/>na triagem"]
    S5 --> S6["📅 Candidato agenda<br/>entrevista com o RH"]
    S6 --> S7["💬 RH<br/>entrevista"]
    S7 --> S8["🎯 RH aprova →<br/>contratação"]

    classDef store fill:#fde68a,stroke:#b45309,color:#7c2d12;
    classDef cand fill:#e0e7ff,stroke:#4338ca,color:#312e81;
    classDef done fill:#dcfce7,stroke:#15803d,color:#14532d;
    class S2 store;
    class S3,S4,S6 cand;
    class S8 done;
```

---

## Legenda

| Forma / cor | Significado |
|---|---|
| 🔐 Caixa âmbar | Gate de autenticação |
| `[(cilindro azul)]` | Dado/estado que cruza os apps (vaga publicada, candidatura) |
| ✅ Caixa verde | Estado de sucesso/conclusão |
| Seta cheia `-->` | Navegação direta |
| Seta pontilhada `-.->` | Acesso condicional / referência |
| `<-->` | Alternância (abas) |

## Notas
- **Sem backend** (mockup). Sessão do candidato em `localStorage` (`candidato.email`), compartilhada
  entre abas (a vaga abre em nova aba e precisa saber que há sessão).
- As **etapas do processo** (Análise IA → RH → Teste → Gestor → Proposta) são as mesmas no Funil
  (kanban) e no Banco de talentos (stepper do processo).
- Multi-marca (CRP / Trevo) × claro/escuro, i18n pt-BR/en/es, WCAG 2.2 AA.
