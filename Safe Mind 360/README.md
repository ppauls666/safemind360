# SafeMind 360

Sistema de informação para monitoramento do clima escolar e prevenção de conflitos com apoio de Inteligência Artificial. TCC de Kawane Dantas Cavalcante e Paulo César Santos Matos, com orientação de Luana Magalhães Leal.

A IA do SafeMind 360 não faz diagnóstico e não aplica punições. Ela faz triagem e gera sinais; quem decide e acolhe é sempre a equipe escolar (RN01).

A ligação entre cada requisito do artigo (RF, RNF e RN) e o código está em [`REQUISITOS.md`](REQUISITOS.md).

## Como rodar

O sistema é HTML, CSS e JavaScript puro, sem compilação. Sirva a pasta `public` com um servidor estático:

```bash
npx serve public          # ou: npm start
# ou, com Python:
cd public && python3 -m http.server 8080
```

Abra `http://localhost:8080`. A extensão Live Server do VS Code também funciona.

## Contas de demonstração

Com "Onde ficam os dados" em **Demonstração**, todas usam a senha `safemind123`:

| E-mail | Perfil | O que mostrar |
| --- | --- | --- |
| `aluno@safemind.ai` | Estudante (Ana Silva, 9º Ano A) | Termo LGPD, check-in, questionário, relato com 3 níveis, assistente |
| `professor@safemind.ai` | Professora (Helena Rocha) | Indicadores anônimos de 3 turmas; 7º Ano B com alerta de exclusão |
| `coordenacao@safemind.ai` | Coordenação/Psicologia | Alerta prioritário, intervenções, eficácia, acessos, métricas da IA |

`admin@safemind.ai` continua funcionando como coordenação.

Os dados de demonstração são 4 semanas de registros fictícios, processados pelo próprio MotorIA e guardados no navegador. Para recomeçar: **IA e privacidade → Gerar dados de demonstração de novo**.

**Dica para a banca:** abra a coordenação em uma aba e o estudante em outra. Um relato marcado como "Situação de risco" aparece no painel da coordenação na hora, sem recarregar (RNF05 e RN04).

## Ambientes de dados

- **Demonstração:** tudo no navegador; funciona sem internet.
- **Firebase:** Firebase Authentication + Cloud Firestore, com tempo real.

### Configurar o Firebase

1. No console do projeto (`domquixotee-6c490`, em `public/js/config.js`), ative em **Authentication** os provedores *E-mail/senha* e *Google*.
2. Crie o **Cloud Firestore**.
3. Publique as regras: `firebase deploy --only firestore:rules`.
4. Crie a primeira coordenação: cadastre o usuário em **Authentication**, copie o UID e crie o documento `usuarios/{UID}`:
   ```json
   { "nome": "Nome", "email": "email@escola.br", "perfil": "coordenacao", "ativo": true, "turmas": [] }
   ```
   As demais contas da equipe são criadas no painel (aba **Acessos**). Estudantes se cadastram sozinhos.
5. Retenção (LGPD): em **Firestore → TTL**, crie política no campo `expiraEm` para `checkins`, `respostas`, `relatos`, `alertas` e `insights`.

## Publicação

- **Netlify:** o `netlify.toml` publica a pasta `public` com cabeçalhos de segurança.
- **Firebase Hosting:** `firebase deploy` (o `firebase.json` também define os cabeçalhos).

## Instalar como aplicativo (Android e iOS)

É um PWA (RNF04 e RNF06):

- **Android/Chrome e computador:** botão "Instalar o aplicativo" na tela de login ou menu do navegador → *Instalar app*.
- **iPhone/iPad:** no Safari, *Compartilhar → Adicionar à Tela de Início*.

## Testes

```bash
npm test
```

27 testes automatizados (Node 18+, sem dependências): MotorIA, regras RN02–RN07, permissões, LGPD e adaptador do Firestore com Firebase simulado. As telas foram verificadas em navegador (1366 px e 390 px).

## Arquitetura em camadas

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Apresentação | `*.html`, `estilo.css`, `js/ui-*.js` | Telas, acessibilidade, gráficos, PWA |
| Negócio | `js/negocio.js`, `js/motor-ia.js` | Regras RN01–RN07, permissões, MotorIA |
| Dados | `js/dados.js`, `js/dados-demo.js` | Repositório com adaptador local e Firestore |

## Limitações conhecidas

1. **O MotorIA roda no navegador.** Em produção deveria rodar no servidor (Cloud Functions), pois um aparelho adulterado poderia deixar de gerar alertas ou gerar alertas falsos.
2. **As métricas do RNF03 vêm de um conjunto sintético** de 80 frases escrito pela equipe; o resultado (F1 macro 0,96, revocação de risco 1,00) tende a ser otimista. A meta só se comprova com relatos reais anotados por profissionais.
3. **O registro de "equipamento da escola" fica no navegador.** É orientação de uso (Lei nº 15.100/2025); o controle definitivo depende da gestão dos equipamentos e da rede.
4. **O modo Firebase não foi testado contra o projeto real.** O adaptador foi testado com Firebase simulado; valide as regras no Firebase Emulator (`firebase emulators:start`) antes do uso com estudantes.
5. **O termo na tela não substitui a autorização do responsável** (LGPD, art. 14), que a escola deve recolher.

## Ajuda imediata

As telas do estudante indicam o CVV (188, gratuito, 24 h), o SAMU (192) e o Disque 100.
