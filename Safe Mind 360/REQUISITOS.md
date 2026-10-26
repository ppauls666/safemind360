# Matriz de rastreabilidade — SafeMind 360

Liga cada requisito e regra do artigo (seções 6.2, 6.3 e 7) ao código e à forma de verificação. "Teste" refere-se a `npm test`; "Tela" a uma verificação manual no navegador.

## Requisitos funcionais

| Código | Requisito | Onde está | Como verificar |
| --- | --- | --- | --- |
| RF01 | Check-in socioemocional | `Servicos.registrarCheckin` (negocio.js), `ui-aluno.js` | Teste "RF01"; Tela do estudante → humor, palavra, anotação |
| RF02 | Questionários periódicos | `Servicos.responderQuestionario`, `MotorIA.avaliarQuestionario`; gestão em `ui-coordenacao.js` | Teste "RF02" (periodicidade); aba Questionários |
| RF03 | Relatos com 3 níveis de privacidade | `Servicos.enviarRelato`, `NIVEIS_PRIVACIDADE` | Testes "RN03" e "RF03"; quadro "Contar algo para a escola" |
| RF04 | IA identifica padrões de conflito e exclusão | `motor-ia.js` (`analisarTexto`, `avaliarCheckin`, `padroesTurma`) | Testes "PLN" e "Check-in"; aba IA e privacidade → testar frase |
| RF05 | Indicadores, gráficos e alertas no dashboard | `renderGeral`, `renderAlertas` (ui-coordenacao.js) | Tela Visão geral (dados calculados, sem números fixos) |
| RF06 | Registrar intervenções | `Servicos.registrarIntervencao` | Teste "RN07"; botão "Registrar ação" |
| RF07 | Medir eficácia ao longo do tempo | `MotorIA.medirEficacia`, `Servicos.eficacia` | Teste "RF07"; aba Intervenções (antes → depois) |
| RF08 | Níveis de acesso e permissões por perfil | `PERMISSOES`, `pode`, `exigir`, `UI.iniciarPagina`, `firestore.rules` | Testes "RF08"; aba Acessos; professor abrindo admin.html é redirecionado |

## Requisitos não funcionais

| Código | Requisito | Onde está | Como verificar |
| --- | --- | --- | --- |
| RNF01 | LGPD | Termo de ciência, "Seus dados" (exportar/apagar), retenção (`aplicarRetencaoLocal`, TTL `expiraEm`), chat não armazenado, `firestore.rules` | Testes "RNF01", "Retenção", "Termo LGPD" |
| RNF02 | Interface simples e acessível | A+/A−, alto contraste, foco visível, navegação por teclado nas abas, ARIA, `estilo.css` | Tela; Heurísticas de Nielsen e WCAG/e-MAG |
| RNF03 | F1 macro ≥ 0,80; revocação de risco ≥ 0,90 | `MotorIA.avaliarModelo`, `CONJUNTO_VALIDACAO` | Teste "RNF03"; aba IA e privacidade (conjunto sintético, ver limitações) |
| RNF04 | Celular e navegador | PWA: `manifest.webmanifest`, `sw.js`, layout responsivo | Instalar pelo navegador; funciona offline no modo demonstração |
| RNF05 | Dashboard em tempo próximo do real | `Dados.observar` (onSnapshot no Firestore; evento `storage` no local) | Coordenação e estudante em abas diferentes |
| RNF06 | Android e iOS | PWA com ícones, `apple-touch-icon`, metatags iOS | Adicionar à tela inicial |
| RNF07 | Lei nº 15.100/2025 | `Dispositivo` (negocio.js), política de horário, modo quiosque (`ui-comum.js`) | Teste "RN02/RNF07"; aba IA e privacidade |

## Regras de negócio

| Código | Regra | Onde está | Como verificar |
| --- | --- | --- | --- |
| RN01 | IA só auxilia | Alertas com `revisaoHumana: "pendente"`; avisos "não é diagnóstico" nas telas | Detalhe de qualquer alerta |
| RN02 | Prioridade a equipamentos da escola | `Dispositivo.verificarPolitica`, modo quiosque (3 min) | Teste "RN02/RNF07" |
| RN03 | Nível de privacidade obrigatório | `enviarRelato` + regra `relatos` no Firestore | Teste "RN03" |
| RN04 | Notificação prioritária em risco | `avaliarRelato` (`prioritario`), banner, título da aba, notificação do navegador | Testes "RN04"; banner vermelho no painel |
| RN05 | Minimização e anonimização | Coleção `insights` sem identificação; mínimo de 5 registros por turma; relatório CSV por turma; horário arredondado no anônimo | Testes "RF01" e "RN05" |
| RN06 | Acesso por perfil (Estudante, Professor, Coordenação/Psicologia) | `PERMISSOES`, `professor.html`, `firestore.rules` | Teste "RF08"; aba Acessos |
| RN07 | Intervenção obrigatória para mudar status | `alterarStatusAlerta` + regra `alertas` no Firestore (`exists` da intervenção) | Teste "RN07" |
