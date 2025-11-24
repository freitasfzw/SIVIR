# SIVIR

Sistema de monitoramento em tempo real que verifica a conectividade de quartéis militares usando ping/host e exibe o status de cada unidade em um mapa intuitivo.

## 📌 Sobre o Sistema

O NagDash foi desenvolvido para monitorar continuamente a conectividade entre quartéis e o roteador principal.  
Ele testa cada unidade configurada, determina se o enlace está UP, DOWN ou conectado diretamente ao roteador, e apresenta tudo visualmente em um mapa interativo.

O objetivo é fornecer uma visão rápida do estado da rede militar entre diversas organizações militares (OMs), permitindo detectar falhas de forma imediata.

## 🛰️ O que o Sivir Faz

- Realiza testes constantes de ping/host para cada OM cadastrada.
- Identifica automaticamente se a unidade está:
  - Conectada ao roteador principal,
  - Com enlace ativo (UP),
  - Ou com falha de enlace (DOWN).
- Atualiza o status em tempo real.
- Exibe tudo em um mapa intuitivo com posição de cada quartel.
- Utiliza arquivos JSON para cadastrar e organizar as OMs monitoradas.

## 📦 Tecnologias Utilizadas

- Servidor em Nagios Core
- Node.js
- JavaScript
- HTML/CSS
- Servidor simples em `server.js`
- Frontend estático em `public/`
- JSON como base de dados

## 📥 Instalação

Clone o repositório:

```bash
git clone https://github.com/freitasfzw/SIVIR.git
cd SIVIR
npm install
npm run dev
