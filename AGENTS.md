# AGENTS.md - ClimaWise

Este arquivo fornece diretrizes para agentes de IA que trabalham neste projeto.

## Estrutura do Projeto

- `index.html`: Arquivo HTML principal.
- `css/style.css`: Arquivo CSS para estilização.
- `js/script.js`: Arquivo JavaScript para a lógica do aplicativo.

## Estilo de Código

- **HTML:** Use semântica HTML5. Mantenha o código limpo e bem indentado.
- **CSS:** Siga uma abordagem mobile-first. Use nomes de classes descritivos (ex: BEM ou similar, se preferir, mas seja consistente).
- **JavaScript:** Use JavaScript moderno (ES6+). Comente o código quando necessário para explicar a lógica complexa. Use `async/await` para operações assíncronas.

## Cores Principais (Conforme Prompt)

- Azul claro/escuro
- Branco
- Amarelo solar

## Fonte de Dados

- Open-Meteo com modelo ECMWF.
- URL base da API: `https://api.open-meteo.com/v1/forecast`

## Tarefas Comuns

- **Busca de Dados:** Implementar funções para buscar dados da API Open-Meteo.
- **Manipulação do DOM:** Atualizar a interface do usuário com os dados recebidos.
- **Gerenciamento de Estado:** Lidar com as configurações do usuário (tema, unidades).
- **Alertas:** Implementar o sistema de alertas meteorológicos conforme especificado.

## Testes

- Testar a responsividade em diferentes tamanhos de tela (mobile, tablet, desktop).
- Verificar a correta exibição dos dados da API.
- Testar a funcionalidade de mudança de tema e unidades.
- Verificar o funcionamento dos alertas meteorológicos.

## Considerações Adicionais

- **Ícones:** Utilizar ícones modernos e arredondados. Considere usar uma biblioteca de ícones SVG ou fontes de ícones.
- **Animações:** Implementar animações sutis para melhorar a experiência do usuário.
- **Acessibilidade:** Garantir que o aplicativo seja acessível (ex: contraste de cores, atributos ARIA quando apropriado).
- **Tradução:** Todo o texto visível para o usuário deve estar em português do Brasil.
- **Comentários no Código:** Comente o código para explicar partes complexas ou decisões de design.

Lembre-se de seguir o prompt original e as especificações detalhadas nele contidas. O objetivo é criar um aplicativo de previsão do tempo moderno, responsivo e com visual agradável.
