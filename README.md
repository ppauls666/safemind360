<!--
═══════════════════════════════════════════════════════════════════════════════
  SAFEMIND 360 — README
  Este bloco não aparece no GitHub. É o seu guia de edição.
  TUDO QUE PRECISA SER TROCADO ESTÁ MARCADO NO ARQUIVO COM:   ✏️ TROCAR
  Procure por "✏️" (Ctrl+F) para achar cada ponto.
  CHECKLIST
  [ ] 1. seu-usuario/seu-repo .......... caminho do repositório (5 lugares)
  [ ] 2. URL da demonstração ........... hoje está safemind-360.netlify.app
  [ ] 3. docs/screenshots/*.png ........ 2 capturas de tela (a pasta docs/ não existe)
  [ ] 4. docs/demo.gif ................. GIF da demonstração
  [ ] 5. GitHub / LinkedIn / e-mail .... dos dois autores
  [ ] 6. LICENSE ....................... criar o arquivo ou trocar a licença
  OBSERVAÇÃO SOBRE O LAYOUT
  Títulos, textos, tabelas e badges estão centralizados.
  Os blocos de código ficam alinhados à esquerda de propósito: dentro de uma
  div centralizada o GitHub centraliza cada linha de código e fica ilegível.
═══════════════════════════════════════════════════════════════════════════════
-->
 
<div align="center">
<!-- ✏️ TROCAR (opcional): o logo usa o ícone do próprio PWA -->
<img src="public/icones/icone-512.png" alt="Logo do SafeMind 360" width="160">
<h1>🚀 SafeMind 360</h1>
 
**Monitoramento do clima escolar e prevenção de conflitos com apoio de Inteligência Artificial**
 
<!-- ✏️ TROCAR: seu-usuario/seu-repo nos 3 badges e nos 2 links abaixo -->
 
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GitHub Stars](https://img.shields.io/github/stars/seu-usuario/seu-repo?style=social)](https://github.com/seu-usuario/seu-repo/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/seu-usuario/seu-repo?style=social)](https://github.com/seu-usuario/seu-repo/network/members)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
 
[![Versão](https://img.shields.io/badge/vers%C3%A3o-2.0.0-6c5ce7.svg)](#)
[![Testes](https://img.shields.io/badge/testes-27%20passando-brightgreen.svg)](#-testes)
[![Dependências](https://img.shields.io/badge/depend%C3%AAncias-0-success.svg)](#️-tecnologias-utilizadas)
 
<!-- ✏️ TROCAR: a URL da demonstração ao vivo -->
[**Demo ao Vivo**](https://safemind-360.netlify.app) · [Reportar Bug](https://github.com/seu-usuario/seu-repo/issues) · [Solicitar Feature](https://github.com/seu-usuario/seu-repo/issues)
 
</div>
---
 
<h2 align="center">📋 Sobre o Projeto</h2>
 
<div align="center">
Bullying, exclusão social e sofrimento emocional aparecem na escola muito antes de alguém pedir ajuda — e quase sempre em sinais pequenos: a mesma criança sozinha no recreio, a turma que piora de humor toda terça, o relato que ninguém teve coragem de assinar.
 
O **SafeMind 360** recolhe esses sinais com consentimento, analisa os textos com Processamento de Linguagem Natural e entrega à equipe escolar um painel com indicadores por turma, alertas priorizados e medição da eficácia de cada intervenção.<br>
O estudante ganha um canal seguro com três níveis de privacidade. O professor vê a turma, nunca o indivíduo. A coordenação vê o que precisa para agir.
 
> ⚠️ **A IA não diagnostica e não pune.**<br>
> Ela faz triagem e gera sinais; quem decide, acolhe e intervém é sempre a equipe escolar.<br>
> Todo alerta nasce com `revisaoHumana: "pendente"` (RN01).
 
Trabalho de Conclusão de Curso de **Kawane Dantas Cavalcante** e **Paulo César Santos Matos**<br>
Orientação: **Luana Magalhães Leal**
 
A ligação entre cada requisito do artigo (RF01–RF08, RNF01–RNF07 e RN01–RN07) e o código está em [`REQUISITOS.md`](REQUISITOS.md).
 
</div>
<h3 align="center">✨ Principais Funcionalidades</h3>
 
<div align="center">
| | Funcionalidade | O que faz |
| :---: | :--- | :--- |
| 🧠 | **Triagem com PLN** | Classifica textos em cinco categorias, com normalização de gírias, tratamento de negação e detecção de repetição |
| 🔒 | **Três níveis de privacidade** | Anônimo, confidencial ou situação de risco — de escolha obrigatória e aplicada também no servidor |
| ⚡ | **Painel em tempo real** | Um relato de risco chega à coordenação na hora, sem recarregar a página |
| ✅ | **Intervenção obrigatória** | Nenhum alerta muda de status sem ação registrada, e a eficácia é medida 14 dias depois |
| 🕵️ | **Anonimato por construção** | O professor só vê dados consolidados, e nenhum indicador aparece com menos de 5 registros |
| 📱 | **PWA offline** | Instala no Android, iOS e computador, e funciona sem internet no modo demonstração |
| ♿ | **Acessível** | Ajuste de fonte, alto contraste, navegação por teclado, foco visível e ARIA nas abas |
| 🎯 | **Zero dependências** | HTML, CSS e JavaScript puro, sem build e sem `node_modules` |
 
</div>
---
 
<h2 align="center">🎬 Demonstração</h2>
 
<h3 align="center">Screenshots</h3>
 
<!-- ✏️ TROCAR: criar a pasta docs/screenshots/ e colocar as 2 imagens -->
 
<div align="center">
  <img src="docs/screenshots/tela-aluno.png" alt="Tela do estudante" width="45%">
  <img src="docs/screenshots/painel-coordenacao.png" alt="Painel da coordenação" width="45%">
</div>
<h3 align="center">GIF Demonstrativo</h3>
 
<!-- ✏️ TROCAR: gravar o GIF — sugestão: relato de risco saindo do aluno e chegando ao painel -->
 
<div align="center">
  <img src="docs/demo.gif" alt="Relato de risco chegando ao painel em tempo real" width="80%">
</div>
<h3 align="center">Contas de Demonstração</h3>
 
<div align="center">
Com **"Onde ficam os dados" → Demonstração**, todas usam a senha `safemind123`
 
| E-mail | Perfil | O que mostrar |
| :--- | :--- | :--- |
| `aluno@safemind.ai` | Estudante (Ana Silva, 9º Ano A) | Termo LGPD, check-in, questionário, relato com 3 níveis, assistente |
| `professor@safemind.ai` | Professora (Helena Rocha) | Indicadores anônimos de 3 turmas; 7º Ano B com alerta de exclusão |
| `coordenacao@safemind.ai` | Coordenação/Psicologia | Alerta prioritário, intervenções, eficácia, acessos, métricas da IA |
 
> 💡 **Dica para a banca:** abra a coordenação em uma aba e o estudante em outra.<br>
> Um relato marcado como "Situação de risco" aparece no painel na hora (RNF05 e RN04).
 
</div>
---
 
<h2 align="center">🛠️ Tecnologias Utilizadas</h2>
 
<h3 align="center">Frontend</h3>
 
<div align="center">
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
 
</div>
<h3 align="center">Backend</h3>
 
<div align="center">
![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Cloud Firestore](https://img.shields.io/badge/Cloud_Firestore-F57C00?style=for-the-badge&logo=firebase&logoColor=white)
![Security Rules](https://img.shields.io/badge/Security_Rules-039BE5?style=for-the-badge&logo=firebase&logoColor=white)
 
</div>
<h3 align="center">Ferramentas</h3>
 
<div align="center">
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
 
Sem framework, sem empacotador e sem pré-processador: o que está em `public/` é exatamente o que vai para o ar.<br>
Os testes usam o `node --test` nativo. As únicas dependências em tempo de execução são o SDK do Firebase e os ícones Material Symbols, ambos por CDN e liberados na CSP.
 
</div>
---
 
<h2 align="center">🚀 Começando</h2>
 
<h3 align="center">📦 Pré-requisitos</h3>
 
<div align="center">
| Ferramenta | Versão | Para quê |
| :--- | :---: | :--- |
| Navegador moderno | — | Chrome, Edge, Firefox ou Safari |
| [Node.js](https://nodejs.org/) | 18+ | `npm start` e `npm test` |
| [Git](https://git-scm.com/) | — | Clonar o repositório |
| [Firebase CLI](https://firebase.google.com/docs/cli) | opcional | Publicar regras e hospedagem |
 
</div>
<h3 align="center">💻 Instalação</h3>
 
<p align="center"><b>1. Clone o repositório</b></p>
<!-- ✏️ TROCAR: seu-usuario/seu-repo -->
 
```bash
git clone https://github.com/seu-usuario/seu-repo.git
```
 
<p align="center"><b>2. Acesse a pasta do projeto</b></p>
```bash
cd "Safe Mind 360"
```
 
<p align="center"><b>3. Instale as dependências</b></p>
<div align="center">
 
O SafeMind 360 não tem nenhuma dependência: não existe `node_modules` e não há etapa de build.<br>
Para confirmar que o ambiente está pronto, rode os testes — eles usam só o Node:
 
</div>
```bash
node --version    # precisa ser 18 ou superior
npm test          # 27 testes, todos devem passar
```
 
<div align="center">
Só quem for publicar no Firebase precisa da CLI (opcional):
 
</div>
```bash
npm install -g firebase-tools
```
 
<p align="center"><b>4. Configure o ambiente</b></p>
<div align="center">
Não existe `.env`. O sistema roda inteiro no navegador, então a configuração fica em **`public/js/config.js`**.<br>
As chaves do Firebase são públicas por natureza — quem protege os dados é o `firestore.rules`.
 
</div>
```javascript
SM.Config = {
  firebase: { apiKey: "...", projectId: "...", /* ... */ },
  kMinimo: 5,                             // RN05  — mínimo de registros por indicador
  retencaoDias: 180,                      // RNF01 — retenção
  inatividadeQuiosqueMs: 3 * 60 * 1000,   // RN02  — modo quiosque
  janelaEficaciaDias: 14,                 // RF07  — janela de medição
  metasIA: { f1Macro: 0.80, recallRisco: 0.90 }   // RNF03
};
```
 
<div align="center">
Para usar um projeto Firebase próprio: troque também o `default` em `.firebaserc`, ative *E-mail/senha* e *Google* em **Authentication**, crie o **Cloud Firestore**, publique as regras com `npm run deploy:regras` e configure a política de **TTL** no campo `expiraEm` para `checkins`, `respostas`, `relatos`, `alertas` e `insights`.
 
</div>
<p align="center"><b>5. Execute o projeto</b></p>
```bash
npm start
# ou
cd public && python3 -m http.server 8080
```
 
<p align="center"><b>6. Acesse no navegador</b></p>
```
http://localhost:8080
```
 
<div align="center">
> ⚠️ Abrir os arquivos com duplo clique (`file://`) não funciona:<br>
> o service worker e o `fetch` exigem `http://`.
 
</div>
---
 
<h2 align="center">📖 Como Usar</h2>
 
<div align="center">
Tudo vive sob o objeto global `window.SafeMind`<br>
`SM.Config` · `SM.Dados` · `SM.MotorIA` · `SM.Negocio` · `SM.Servicos` · `SM.Sessao` · `SM.UI`
 
</div>
<h3 align="center">Exemplo Básico</h3>
 
```javascript
// Classificar um texto com o MotorIA (funções puras: rodam no navegador e no Node)
const analise = SafeMind.MotorIA.analisarTexto(
  "ninguém senta comigo no recreio, todo dia me deixam de lado"
);
 
console.log(analise);
// {
//   classe: "EXCLUSAO_SOCIAL",
//   rotulo: "Exclusão social",
//   grauRisco: "moderado",
//   repeticao: true,          // "todo dia" — marcador central do bullying
//   sentimento: -0.88,
//   confianca: 95,
//   termos: ["ninguem senta", "deixam de lado"]
// }
```
 
<h3 align="center">Exemplo Avançado</h3>
 
```javascript
// Enviar um relato pela camada de negócio: o serviço valida a permissão,
// aplica o nível de privacidade, chama o MotorIA, grava o insight anônimo
// da turma e abre o alerta — tudo em uma chamada.
const sessao = SafeMind.Sessao.atual();
 
const { relato, analise, mensagem } = await SafeMind.Servicos.enviarRelato(sessao, {
  titulo: "Mexem comigo na saída",
  descricao: "Toda semana um grupo fica me xingando quando eu saio da escola.",
  nivelPrivacidade: "CONFIDENCIAL"   // ANONIMO | CONFIDENCIAL | SITUACAO_DE_RISCO
});
 
// No nível ANONIMO, autorUid e autorNome vão nulos e o horário é arredondado
// para o início da hora (minimização — RN05).
 
// Do outro lado, o painel escuta a coleção e reage sem recarregar (RNF05):
SafeMind.Dados.observar("alertas", { status: "novo" }, (alertas) => {
  const prioritarios = alertas.filter(a => a.prioritario);
  // ...atualiza o banner vermelho e o contador da aba
});
 
// E para medir o modelo (RNF03):
const m = SafeMind.MotorIA.avaliarModelo();
console.log(m.f1Macro, m.recallRisco);   // 0.962  1
```
 
---
 
<h2 align="center">🗂️ Estrutura de Pastas</h2>
 
```
📦 Safe Mind 360
├── 📁 public/                 # tudo o que vai para o ar
│   ├── 📁 js/
│   │   ├── 📄 config.js       # configuração geral
│   │   ├── 📄 dados.js        # repositório: adaptadores Local e Firestore
│   │   ├── 📄 dados-demo.js   # gerador do conjunto de demonstração
│   │   ├── 📄 motor-ia.js     # MotorIA: PLN, triagem e métricas
│   │   ├── 📄 negocio.js      # regras RN01–RN07, permissões, serviços
│   │   └── 📄 ui-*.js         # telas (comum, login, aluno, professor, coordenação)
│   ├── 📁 icones/             # ícones do PWA
│   ├── 📄 index.html          # login e cadastro
│   ├── 📄 aluno.html          # tela do estudante
│   ├── 📄 professor.html      # tela do professor
│   ├── 📄 admin.html          # painel da coordenação
│   ├── 📄 estilo.css          # design system, temas e acessibilidade
│   ├── 📄 sw.js               # service worker (rede primeiro)
│   └── 📄 manifest.webmanifest
├── 📁 testes/                 # node --test, sem dependências
├── 📁 docs/                   # ✏️ CRIAR: screenshots e GIF do README
├── 📄 firestore.rules         # as mesmas permissões, aplicadas no servidor
├── 📄 firebase.json           # Hosting + cabeçalhos de segurança
├── 📄 netlify.toml            # publicação alternativa
├── 📄 package.json
├── 📄 REQUISITOS.md           # matriz de rastreabilidade
└── 📄 README.md
```
 
<h3 align="center">Arquitetura em Camadas</h3>
 
<div align="center">
| Camada | Arquivos | Responsabilidade |
| :--- | :--- | :--- |
| **Apresentação** | `*.html`, `estilo.css`, `js/ui-*.js` | Telas, acessibilidade, gráficos, PWA |
| **Negócio** | `js/negocio.js`, `js/motor-ia.js` | Regras RN01–RN07, permissões, MotorIA |
| **Dados** | `js/dados.js`, `js/dados-demo.js` | Repositório único com dois adaptadores |
 
A camada de dados expõe uma interface só — `adicionar`, `definir`, `atualizar`, `remover`, `obter`, `listar`, `observar` — e troca o adaptador por baixo:
 
</div>
```
Negócio → SM.Dados → Local  (localStorage, evento "storage")
                   → Remoto (Cloud Firestore, onSnapshot)
```
 
<div align="center">
Por isso o sistema roda offline na demonstração e em tempo real no Firebase sem nenhuma mudança na camada de negócio.<br>
As permissões são declaradas uma vez em `PERMISSOES` e verificadas três vezes: no menu que a interface desenha, na função `exigir()` antes de cada serviço e, no modo Firebase, de novo pelo `firestore.rules` no servidor.
 
</div>
---
 
<h2 align="center">🧪 Testes</h2>
 
```bash
npm test
```
 
<div align="center">
**27 testes, todos passando** — Node 18+, `node --test` nativo, sem nenhuma dependência
 
| Arquivo | Cobre |
| :--- | :--- |
| `testes/motor-ia.test.js` | PLN, gírias, negação, repetição, check-in, questionário, `padroesTurma`, `medirEficacia`, metas do RNF03 |
| `testes/regras.test.js` | RN02–RN07, permissões por perfil (RF08), retenção, termo LGPD |
| `testes/firestore-adaptador.test.js` | Adaptador do Firestore com Firebase simulado |
 
Resultados do modelo (`MotorIA.avaliarModelo()`, sobre 80 frases de validação)
 
| Métrica | Meta (RNF03) | Resultado |
| :--- | :---: | :---: |
| F1 macro | ≥ 0,80 | **0,96** ✅ |
| Revocação de "Situação de risco" | ≥ 0,90 | **1,00** ✅ |
 
As telas foram verificadas manualmente em navegador, a 1366 px e a 390 px.
 
</div>
---
 
<h2 align="center">🔐 Privacidade e LGPD</h2>
 
<div align="center">
| Mecanismo | Onde está |
| :--- | :--- |
| Termo de ciência no primeiro acesso, com versionamento | `precisaConsentimento`, `registrarConsentimento` |
| Três níveis de privacidade, de escolha obrigatória | `NIVEIS_PRIVACIDADE`, `enviarRelato` (RN03) |
| Coleção `insights` sem identificação e com horário arredondado | `registrarInsight` (RN05) |
| *k*-anonimato: indicador de turma só com 5+ registros | `Config.kMinimo` (RN05) |
| Retenção de 180 dias — local por varredura, no Firestore por TTL | `aplicarRetencaoLocal` (RNF01) |
| Conversa com o Assistente Safe não é armazenada | `analisarMensagemAssistente` |
| Titular exporta e apaga os próprios registros | `exportarMeusDados`, `excluirMeusRegistros` |
| Professor nunca vê dado individual | `PERMISSOES` + regra de `insights` |
| CSP, HSTS, `Referrer-Policy`, `Permissions-Policy` | `firebase.json`, `netlify.toml` |
 
Em `relatos`, a regra do servidor só aceita o documento se o nível for `ANONIMO` **e** não houver autor, ou se for `CONFIDENCIAL`/`SITUACAO_DE_RISCO` **e** o autor for quem escreve (RN03).<br>
Em `alertas`, o status só muda se existir a intervenção referenciada em `ultimaIntervencaoId` (RN07).
 
**Lei nº 15.100/2025:** `Dispositivo.verificarPolitica` aplica a política da escola (`desativado`, `avisar` ou `bloquear`) por horário e dia letivo, e o modo quiosque encerra a sessão do estudante após 3 minutos sem uso em equipamento institucional.
 
</div>
---
 
<h2 align="center">⚠️ Limitações Conhecidas</h2>
 
<div align="center">
| # | Limitação |
| :---: | :--- |
| 1 | **O MotorIA roda no navegador.** Em produção deveria rodar no servidor (Cloud Functions), pois um aparelho adulterado poderia deixar de gerar alertas ou gerar alertas falsos |
| 2 | **As métricas do RNF03 vêm de um conjunto sintético** de 80 frases escrito pela equipe; o resultado tende a ser otimista. A meta só se comprova com relatos reais anotados por profissionais |
| 3 | **O registro de "equipamento da escola" fica no navegador.** É orientação de uso; o controle definitivo depende da gestão dos equipamentos e da rede |
| 4 | **O modo Firebase não foi testado contra o projeto real.** Valide as regras no emulador (`firebase emulators:start`) antes do uso com estudantes |
| 5 | **O termo na tela não substitui a autorização do responsável** (LGPD, art. 14), que a escola deve recolher |
 
<h3>🧹 Pendências Técnicas</h3>
 
| Arquivo | Problema |
| :--- | :--- |
| `public/icones/icone.svg` | Referenciado nas 4 páginas, no manifest e no `sw.js`, mas **não existe**. Como `cache.addAll()` falha por inteiro em um 404, a instalação do service worker é abortada e o modo offline não funciona |
| `public/app.js` | Monolito órfão da versão 1, com a config do Firebase duplicada. Nenhuma página o carrega — pode ser removido |
 
</div>
---
 
<h2 align="center">🤝 Contribuindo</h2>
 
<div align="center">
Contribuições são sempre bem-vindas!
 
**1.** Faça um Fork do projeto<br>
**2.** Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`)<br>
**3.** Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)<br>
**4.** Push para a Branch (`git push origin feature/MinhaFeature`)<br>
**5.** Abra um Pull Request
 
Antes de abrir o PR, rode `npm test` — os 27 testes precisam continuar passando.<br>
Mudanças em regras de negócio devem vir com o teste correspondente e com a linha atualizada em [`REQUISITOS.md`](REQUISITOS.md).
 
</div>
---
 
<h2 align="center">📄 Licença</h2>
 
<!-- ✏️ TROCAR: o arquivo LICENSE ainda não existe e o package.json está como "private": true.
     Ou você cria o LICENSE (MIT) com os nomes dos autores, ou troca esta seção e o badge do topo. -->
 
<div align="center">
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
 
</div>
---
 
<h2 align="center">👨‍💻 Autores</h2>
 
<!-- ✏️ TROCAR: GitHub, LinkedIn e e-mail dos dois autores -->
 
<div align="center">
**Kawane Dantas Cavalcante**
 
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:seu.email@example.com)
 
**Paulo César Santos Matos**
 
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:seu.email@example.com)
 
**Orientação:** Luana Magalhães Leal
 
</div>
---
 
<h2 align="center">🙏 Agradecimentos</h2>
 
<div align="center">
À orientadora **Luana Magalhães Leal**, pela condução do trabalho<br>
À escola e à equipe pedagógica que discutiram os requisitos com a gente<br>
Ícones por [Material Symbols](https://fonts.google.com/icons)<br>
Diretrizes de acessibilidade: [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) e [e-MAG](https://emag.governoeletronico.gov.br/)
 
</div>
---
 
<h2 align="center">☎️ Ajuda Imediata</h2>
 
<div align="center">
As telas do estudante indicam, em todos os pontos sensíveis:
 
| | Serviço | Número |
| :---: | :--- | :---: |
| 💙 | CVV (gratuito, 24 h) | **188** |
| 🚑 | SAMU | **192** |
| ⚖️ | Disque Direitos Humanos | **100** |
 
</div>
---
 
<div align="center">
**O sistema sinaliza; o cuidado é das pessoas.**
 
**⭐ Se este projeto foi útil, considere dar uma estrela!**
 
Made with ❤️ by Kawane Dantas Cavalcante e Paulo César Santos Matos
 
</div>
