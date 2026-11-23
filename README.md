<!--
  ╔══════════════════════════════════════════════════════════════════════════╗
  ║  GUIA DE EDIÇÃO — invisível no GitHub                                    ║
  ║  Procure por "✏️" (Ctrl+F) para achar cada ponto que precisa ser trocado. ║
  ╠══════════════════════════════════════════════════════════════════════════╣
  ║  [ ] 1. seu-usuario/seu-repo ...... caminho do repositório (6 lugares)    ║
  ║  [ ] 2. URL da demonstração ....... hoje: safemind-360.netlify.app        ║
  ║  [ ] 3. docs/screenshots/*.png .... 2 capturas (a pasta docs/ não existe) ║
  ║  [ ] 4. docs/demo.gif ............. GIF da demonstração                   ║
  ║  [ ] 5. GitHub / LinkedIn / e-mail  dos dois autores                      ║
  ║  [ ] 6. LICENSE ................... criar o arquivo ou trocar a licença   ║
  ╚══════════════════════════════════════════════════════════════════════════╝
-->
 
# 🚀 SafeMind 360
 
<div align="center">
 
**Monitoramento do clima escolar e prevenção de conflitos com apoio de Inteligência Artificial**
 
<!-- ✏️ TROCAR: seu-usuario/seu-repo nos badges e links abaixo -->
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![GitHub Stars](https://img.shields.io/github/stars/seu-usuario/seu-repo?style=social)](https://github.com/seu-usuario/seu-repo/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/seu-usuario/seu-repo?style=social)](https://github.com/seu-usuario/seu-repo/network/members)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
 
<!-- ✏️ TROCAR: a URL da demonstração ao vivo -->
[Demo ao Vivo](https://safemind360.netlify.app/) · [Reportar Bug](https://github.com/ppauls666/safemind360/issues) · [Solicitar Feature](https://github.com/ppauls666/safemind360)
 
</div>
---
 
## 📋 Sobre o Projeto
 
Bullying, exclusão social e sofrimento emocional aparecem na escola muito antes de alguém pedir ajuda — e quase sempre em sinais pequenos: a mesma criança sozinha no recreio, a turma que piora de humor toda terça, o relato que ninguém teve coragem de assinar.
 
O **SafeMind 360** recolhe esses sinais com consentimento, analisa os textos com Processamento de Linguagem Natural e entrega à equipe escolar um painel com indicadores por turma, alertas priorizados e medição da eficácia de cada intervenção. O estudante ganha um canal seguro com três níveis de privacidade. O professor vê a turma, nunca o indivíduo. A coordenação vê o que precisa para agir.
 
> ⚠️ **A IA não diagnostica e não pune.** Ela faz triagem e gera sinais; quem decide, acolhe e intervém é sempre a equipe escolar. Todo alerta nasce com `revisaoHumana: "pendente"` (RN01).
 
Trabalho de Conclusão de Curso de **Kawane Dantas Cavalcante** e **Paulo César Santos Matos**, com orientação de **Luana Magalhães Leal**. A ligação entre cada requisito do artigo (RF01–RF08, RNF01–RNF07 e RN01–RN07) e o código está em [`REQUISITOS.md`](REQUISITOS.md).
 
### ✨ Principais Funcionalidades
 
- 🧠 **Triagem com PLN** - Classifica textos em cinco categorias, com normalização de gírias, tratamento de negação e detecção de repetição
- 🔒 **Três níveis de privacidade** - Anônimo, confidencial ou situação de risco, de escolha obrigatória e aplicada também no servidor
- ⚡ **Painel em tempo real** - Um relato de risco chega à coordenação na hora, sem recarregar a página
- ✅ **Intervenção obrigatória** - Nenhum alerta muda de status sem ação registrada, e a eficácia é medida 14 dias depois
- 🕵️ **Anonimato por construção** - O professor só vê dados consolidados, e nenhum indicador aparece com menos de 5 registros
- 📱 **PWA offline** - Instala no Android, iOS e computador, e funciona sem internet no modo demonstração
- ♿ **Acessível** - Ajuste de fonte, alto contraste, navegação por teclado, foco visível e ARIA nas abas
- 🎯 **Zero dependências** - HTML, CSS e JavaScript puro, sem build e sem `node_modules`
---
 
## 🎬 Demonstração
 
### Screenshots
 
<!-- ✏️ TROCAR: criar a pasta docs/screenshots/ e colocar as 2 imagens -->
 
<div align="center">
  <img src="docs/screenshots/tela-aluno.png" alt="Tela do estudante" width="45%">
  <img src="docs/screenshots/painel-coordenacao.png" alt="Painel da coordenação" width="45%">
</div>

### Contas de Demonstração
 
Com **"Onde ficam os dados" → Demonstração**, todas usam a senha `safemind123`:
 
| E-mail | Perfil | O que mostrar |
| --- | --- | --- |
| `aluno@safemind.ai` | Estudante (Ana Silva, 9º Ano A) | Termo LGPD, check-in, questionário, relato com 3 níveis, assistente |
| `professor@safemind.ai` | Professora (Helena Rocha) | Indicadores anônimos de 3 turmas; 7º Ano B com alerta de exclusão |
| `coordenacao@safemind.ai` | Coordenação/Psicologia | Alerta prioritário, intervenções, eficácia, acessos, métricas da IA |
 
> 💡 **Dica para a banca:** abra a coordenação em uma aba e o estudante em outra. Um relato marcado como "Situação de risco" aparece no painel na hora (RNF05 e RN04).
 
---
 
## 🛠️ Tecnologias Utilizadas
 
### Frontend
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
- ![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
### Backend
- ![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
- ![Cloud Firestore](https://img.shields.io/badge/Cloud_Firestore-F57C00?style=for-the-badge&logo=firebase&logoColor=white)
- ![Security Rules](https://img.shields.io/badge/Security_Rules-039BE5?style=for-the-badge&logo=firebase&logoColor=white)
### Ferramentas
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
- ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
- ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
- ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
Sem framework, sem empacotador e sem pré-processador: o que está em `public/` é exatamente o que vai para o ar. Os testes usam o `node --test` nativo. As únicas dependências em tempo de execução são o SDK do Firebase e os ícones Material Symbols, ambos por CDN e liberados na CSP.
 
---
 
## 🚀 Começando
 
### 📦 Pré-requisitos
 
Antes de começar, certifique-se de ter instalado:
 
- Um navegador moderno (Chrome, Edge, Firefox ou Safari)
- [Node.js](https://nodejs.org/) (versão 18 ou superior) — só para `npm start` e `npm test`
- [Git](https://git-scm.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli) (opcional) — para publicar regras e hospedagem
### 💻 Instalação
 
1. **Clone o repositório**
   <!-- ✏️ TROCAR: seu-usuario/seu-repo -->
```bash
git clone https://github.com/seu-usuario/seu-repo.git
```
 
2. **Acesse a pasta do projeto**
```bash
cd "Safe Mind 360"
```
 
3. **Instale as dependências**
   O projeto tem zero dependências: não existe `node_modules` e não há etapa de build. Para confirmar que o ambiente está pronto, rode os testes:
```bash
node --version    # precisa ser 18 ou superior
npm test          # 27 testes, todos devem passar
```
 
   Só quem for publicar no Firebase precisa da CLI (opcional):
 
```bash
npm install -g firebase-tools
```
 
4. **Configure o ambiente**
   Não existe `.env`. O sistema roda inteiro no navegador, então a configuração fica em `public/js/config.js` — as chaves do Firebase são públicas por natureza e quem protege os dados é o `firestore.rules`:
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
 
   Para usar um projeto Firebase próprio, troque também o `default` em `.firebaserc`, ative *E-mail/senha* e *Google* em **Authentication**, crie o **Cloud Firestore**, publique as regras com `npm run deploy:regras` e configure a política de **TTL** no campo `expiraEm` para `checkins`, `respostas`, `relatos`, `alertas` e `insights`.
 
5. **Execute o projeto**
```bash
npm start
# ou
cd public && python3 -m http.server 8080
```
 
6. **Acesse no navegador**
```
http://localhost:8080
```
 
> ⚠️ Abrir os arquivos com duplo clique (`file://`) não funciona: o service worker e o `fetch` exigem `http://`.
 
---
 
## 📖 Como Usar
 
Tudo vive sob o objeto global `window.SafeMind` — `SM.Config`, `SM.Dados`, `SM.MotorIA`, `SM.Negocio`, `SM.Servicos`, `SM.Sessao` e `SM.UI`.
 
### Exemplo Básico
 
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
 
### Exemplo Avançado
 
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
 
## 🗂️ Estrutura de Pastas
 
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
 
### Arquitetura em Camadas
 
| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| **Apresentação** | `*.html`, `estilo.css`, `js/ui-*.js` | Telas, acessibilidade, gráficos, PWA |
| **Negócio** | `js/negocio.js`, `js/motor-ia.js` | Regras RN01–RN07, permissões, MotorIA |
| **Dados** | `js/dados.js`, `js/dados-demo.js` | Repositório único com dois adaptadores |
 
A camada de dados expõe uma interface só — `adicionar`, `definir`, `atualizar`, `remover`, `obter`, `listar`, `observar` — e troca o adaptador por baixo:
 
```
Negócio → SM.Dados → Local  (localStorage, evento "storage")
                   → Remoto (Cloud Firestore, onSnapshot)
```
 
Por isso o sistema roda offline na demonstração e em tempo real no Firebase sem nenhuma mudança na camada de negócio. As permissões são declaradas uma vez em `PERMISSOES` e verificadas três vezes: no menu que a interface desenha, na função `exigir()` antes de cada serviço e, no modo Firebase, de novo pelo `firestore.rules` no servidor.
 
---
 
## 🧪 Testes
 
Execute os testes com:
 
```bash
npm test
```
 
**27 testes, todos passando** — Node 18+, `node --test` nativo, sem nenhuma dependência.
 
| Arquivo | Cobre |
| --- | --- |
| `testes/motor-ia.test.js` | PLN, gírias, negação, repetição, check-in, questionário, `padroesTurma`, `medirEficacia`, metas do RNF03 |
| `testes/regras.test.js` | RN02–RN07, permissões por perfil (RF08), retenção, termo LGPD |
| `testes/firestore-adaptador.test.js` | Adaptador do Firestore com Firebase simulado |
 
Resultados do modelo (`MotorIA.avaliarModelo()`, sobre 80 frases de validação):
 
| Métrica | Meta (RNF03) | Resultado |
| --- | --- | --- |
| F1 macro | ≥ 0,80 | **0,96** ✅ |
| Revocação de "Situação de risco" | ≥ 0,90 | **1,00** ✅ |
 
As telas foram verificadas manualmente em navegador, a 1366 px e a 390 px.
 
---
 
## 🔐 Privacidade e LGPD
 
| Mecanismo | Onde está |
| --- | --- |
| Termo de ciência no primeiro acesso, com versionamento | `precisaConsentimento`, `registrarConsentimento` |
| Três níveis de privacidade, de escolha obrigatória | `NIVEIS_PRIVACIDADE`, `enviarRelato` (RN03) |
| Coleção `insights` sem identificação e com horário arredondado | `registrarInsight` (RN05) |
| *k*-anonimato: indicador de turma só com 5+ registros | `Config.kMinimo` (RN05) |
| Retenção de 180 dias — local por varredura, no Firestore por TTL | `aplicarRetencaoLocal` (RNF01) |
| Conversa com o Assistente Safe não é armazenada | `analisarMensagemAssistente` |
| Titular exporta e apaga os próprios registros | `exportarMeusDados`, `excluirMeusRegistros` |
| Professor nunca vê dado individual | `PERMISSOES` + regra de `insights` |
| CSP, HSTS, `Referrer-Policy`, `Permissions-Policy` | `firebase.json`, `netlify.toml` |
 
Em `relatos`, a regra do servidor só aceita o documento se o nível for `ANONIMO` **e** não houver autor, ou se for `CONFIDENCIAL`/`SITUACAO_DE_RISCO` **e** o autor for quem escreve (RN03). Em `alertas`, o status só muda se existir a intervenção referenciada em `ultimaIntervencaoId` (RN07).
 
**Lei nº 15.100/2025:** `Dispositivo.verificarPolitica` aplica a política da escola (`desativado`, `avisar` ou `bloquear`) por horário e dia letivo, e o modo quiosque encerra a sessão do estudante após 3 minutos sem uso em equipamento institucional.
 
---
 
## ⚠️ Limitações Conhecidas
 
1. **O MotorIA roda no navegador.** Em produção deveria rodar no servidor (Cloud Functions), pois um aparelho adulterado poderia deixar de gerar alertas ou gerar alertas falsos.
2. **As métricas do RNF03 vêm de um conjunto sintético** de 80 frases escrito pela equipe; o resultado tende a ser otimista. A meta só se comprova com relatos reais anotados por profissionais.
3. **O registro de "equipamento da escola" fica no navegador.** É orientação de uso; o controle definitivo depende da gestão dos equipamentos e da rede.
4. **O modo Firebase não foi testado contra o projeto real.** Valide as regras no emulador (`firebase emulators:start`) antes do uso com estudantes.
5. **O termo na tela não substitui a autorização do responsável** (LGPD, art. 14), que a escola deve recolher.
### 🧹 Pendências Técnicas
 
- **`public/icones/icone.svg` não existe** - É referenciado nas 4 páginas, no manifest e no `sw.js`. Como `cache.addAll()` falha por inteiro em um 404, a instalação do service worker é abortada e o modo offline não funciona
- **`public/app.js` está órfão** - Monolito da versão 1, com a config do Firebase duplicada; nenhuma página o carrega e pode ser removido
---
 
## 🤝 Contribuindo
 
Contribuições são sempre bem-vindas!
 
1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a Branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request
Antes de abrir o PR, rode `npm test` — os 27 testes precisam continuar passando. Mudanças em regras de negócio devem vir com o teste correspondente e com a linha atualizada em [`REQUISITOS.md`](REQUISITOS.md).
 
---
 
## 📄 Licença
 
<!-- ✏️ TROCAR: o arquivo LICENSE ainda não existe e o package.json está como "private": true.
     Crie o LICENSE (MIT) com os nomes dos autores, ou troque esta seção e o badge do topo. -->
 
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
 
---
 
## 👨‍💻 Autores
 
<!-- ✏️ TROCAR: GitHub, LinkedIn e e-mail dos dois autores -->
 
**Kawane Dantas Cavalcante**
 
- GitHub: [@kawane.cacau](kawane.cacau@gmail.com)
- LinkedIn: [Kawane Dantas Cavalcante](https://www.linkedin.com/in/kawane-dantas-3442412b0/)
- Email:  kawane.cavalcante@hotmail.com
  
**Paulo César Santos Matos**
 
- GitHub: [@ppauls666](https://github.com/ppauls666)
- LinkedIn: [Paulo César Santos Matos]([https://linkedin.com/in/seu-perfil](https://www.linkedin.com/in/paulo-c%C3%A9sar-a799b8258/))
- Email: paulomatosm90@gmail.com
  
**Orientação:** Luana Magalhães Leal
 
---
 
## 🙏 Agradecimentos
 
- Agradecimento especial à orientadora **Luana Magalhães Leal**, pela condução do trabalho
- À escola e à equipe pedagógica que discutiram os requisitos com a gente
- Ícones por [Material Symbols](https://fonts.google.com/icons)
- Diretrizes de acessibilidade: [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) e [e-MAG](https://emag.governoeletronico.gov.br/)
---
 
## ☎️ Ajuda Imediata
 
As telas do estudante indicam, em todos os pontos sensíveis:
 
- **CVV — 188** (gratuito, 24 h)
- **SAMU — 192**
- **Disque Direitos Humanos — 100**
---
 
<div align="center">
**O sistema sinaliza; o cuidado é das pessoas.**
 
**⭐ Se este projeto foi útil, considere dar uma estrela!**
 
Made with ❤️ by Kawane Dantas Cavalcante e Paulo César Santos Matos
 
</div>
