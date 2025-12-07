# Gestor de Hábitos

### Autor: Gabriel Afinovicz

## Sobre o Projeto

Aplicação web responsiva para criar, monitorar e manter hábitos saudáveis ligados a emagrecimento (água, sono, passos, treino, alimentação consciente). O usuário cadastra hábitos, registra o que fez no dia, acompanha progresso, gráficos. Design limpo, foco em usabilidade e acessibilidade.

#### Objetivo

Ajudar o usuário a ganhar consistência em hábitos que impactam o emagrecimento de forma sustentável, oferecendo feedback visual (percentuais, metas diárias, streaks) e relatórios simples.

#### Público-alvo

Pessoas que querem emagrecer com hábitos diários (iniciante a intermediário), sem dietas extremas.

## Design das Telas - Figma: 

### Prévia Finalizada

https://www.figma.com/design/nU9CPcXy2UOZo5k63KLd14/Gestor-de-H%C3%A1bitos---FitTrack?node-id=0-1&t=Y0BHTYdTWUM31EGW-1

## Design System:

https://drive.google.com/file/d/1v5LPiYX8smAZNP0LOeXyUuCSwrIM0pkZ/view?usp=sharing

## GitHub Pages

https://gabriel-afinovicz.github.io/gestor-de-habitos/

## Framework CSS

MaterializeCSS

## Dependências JavaScript

### Script JSON Server

- npm run dev: observa os arquivos SCSS em src/scss e gera o CSS na pasta css em modo de desenvolvimento (watch).
- npm run build: compila o SCSS de src/scss para css em modo comprimido e aplica o PostCSS/Autoprefixer nos arquivos css/*.css para gerar CSS otimizado para produção.
- npm run predeploy: executa automaticamente o npm run build antes do deploy.
- npm run deploy: publica o conteúdo do projeto na branch de GitHub Pages usando o diretório atual (.) como base.
- npm run api: sobe o JSON Server observando o arquivo api/db.json e disponibiliza a API fake em http://localhost:3000.
- npm run lint: executa o ESLint nos arquivos JavaScript dentro de assets/js/**/*.js para verificar problemas de código/estilo.

> O JSON Server é usado como uma API fake para o projeto e é executado localmente na máquina via npm run api. Em ambientes como o GitHub Pages, apenas o front-end estático (HTML/CSS/JS) é servido, sem o servidor JSON, então as requisições à API fake só funcionarão quando o JSON Server estiver rodando localmente.


## Checklist | Indicadores de Desempenho (ID) dos Resultados de Aprendizagem (RA)

### RA1 - Utilizar Frameworks CSS para estilização de elementos HTML e criação de layouts responsivos.

- [x] ID 01 - Prototipa interfaces adaptáveis para no mínimo os tamanhos de tela mobile e desktop, usando ferramentas de design tradicionais (Figma, Quant UX ou Sketch) ou IA (Stitch).
- [x] ID 02 - Implementa layout responsivo com Framework CSS (Bootstrap, Materialize, Tailwind + DaisyUI) usando Flexbox ou Grid do próprio framework.
- [x] ID 03 - Implementa layout responsivo com CSS puro, usando Flexbox ou Grid Layout.
- [x] ID 04 - Utiliza componentes prontos de um Framework CSS (ex.: card, button) e componentes JavaScript do framework (ex.: modal, carousel).
- [x] ID 05 - Cria layout fluido usando unidades relativas (vw, vh, %, em, rem) no lugar de unidades fixas (px).
- [x] ID 06 - Aplica um Design System consistente (cores, tipografia, padrões de componentes) em toda a aplicação.
- [x] ID 07 - Utiliza Sass (SCSS) com ou sem framework, aplicando variáveis, mixins e funções para modularizar o código.
- [x] ID 08 - Aplica tipografia responsiva (media queries mobile first) ou tipografia fluida (função clamp() + unidades relativas).
- [-] ID 09 – Aplica técnicas de responsividade de imagens usando CSS (object-fit, containers com unidades relativas).
- [-] ID 10 – Otimiza imagens usando formatos modernos (WebP) e carregamento adaptativo (srcset, picture, ou parâmetros do Cloudinary).

### RA2 - Realizar tratamento de formulários e aplicar validações customizadas no lado cliente.

- [x] ID 11 - Implementa validação HTML nativa (campos obrigatórios, tipos, limites de caracteres) com mensagens de erro/sucesso no lado cliente.
- [x] ID 12 - Aplica expressões regulares (REGEX) para validações customizadas (e-mail, telefone, datas, etc.)
- [-] ID 13 - Utiliza elementos de seleção em formulários (checkbox, radio, select) para coleta de dados.
- [x] ID 14 - Implementa leitura e escrita no Web Storage (localStorage/sessionStorage) para persistir dados localmente.

### RA3 - Aplicar ferramentas para otimização do processo de desenvolvimento web.

- [x] ID 15 - Configura ambiente com Node.js e NPM para gerenciamento de pacotes e dependências.
- [x] ID 16 - Utiliza boas práticas de versionamento no Git/GitHub (branch main ou branches específicos, uso de .gitignore).
- [x] ID 17 - Mantém um README.md padronizado, conforme template da disciplina, com checklist preenchido.
- [x] ID 18 - Organiza arquivos do projeto de forma modular, seguindo padrão de exemplo fornecido.
- [x] ID 19 - Configura linters e formatadores (ESLint, Prettier) para manter qualidade e padronização do código.

### RA4 - Aplicar bibliotecas de funções e componentes em JavaScript para aprimorar a interatividade de páginas web.

- [x] ID 20 - Utiliza jQuery para manipulação do DOM e interatividade (eventos, animações, manipulação de elementos)
- [x] ID 21 - Integra e configura um plugin jQuery relevante (ex.: jQuery Mask Plugin). 

### RA5 - Efetuar requisições assíncronas para uma API fake e APIs públicas, permitindo a obtenção e manipulação de dados dinamicamente.

- [x] ID 22 - Realiza requisições assíncronas para uma API fake (ex.: JSON Server) para persistir dados de um formulário.
- [x] ID 23 - Realiza requisições assíncronas para uma API fake para exibir dados na página.
- [x] ID 24 - Realiza requisições assíncronas para APIs públicas reais (OpenWeather, ViaCEP etc.), exibindo os dados e tratando erros.

# Manual de execução
#### Pré-requisitos
> Ter Node.js e npm instalados na máquina.
### 1. Clonar o repositório e entrar na pasta do projeto
 git clone https://github.com/Gabriel-Afinovicz/gestor-de-habitos.git   
 cd gestor-de-habitos
### 2. Instalar as dependências do projeto
   npm install
### 3. Rodar o script de desenvolvimento do SCSS (watcher)
   npm run dev
### 4. Rodar o JSON Server (API fake)
   npm run api
### 5. Abrir a aplicação frontend no navegador
- Recomenda-se usar a extensão Live Server do VS Code (ou outro servidor estático similar) para servir o arquivo index.html na raiz do projeto.
 
# Telas da aplicação

<img width="1920" height="1210" alt="tela 1" src="https://github.com/user-attachments/assets/147b0d9c-34c5-414c-a77e-a89dfb33da41" />
<img width="1920" height="911" alt="tela 2" src="https://github.com/user-attachments/assets/b44d9697-d692-46c7-b905-1d29e356dc8a" />
<img width="1920" height="1373" alt="tela 3" src="https://github.com/user-attachments/assets/1556a9af-3ee6-4cb4-93fa-af4e85abb773" />
<img width="1920" height="911" alt="tela 4" src="https://github.com/user-attachments/assets/ca176b23-634f-491b-a0a2-cb878e40460a" />
