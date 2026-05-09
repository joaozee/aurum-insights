# Product

## Register

product

## Users

Brasileiros entre 25-40 anos numa jornada de investimento que evolui:
**iniciante** vindo do Nubank/XP, querendo aprender e organizar →
**intermediário** consolidando carteira e tracking de dividendos →
**avançado** querendo análise profunda (DY, P/L, screener).

Contexto de uso: smartphone à noite no sofá ou notebook num intervalo do
trabalho. Pessoas que NÃO se identificam com gamificação fintech roxa-laranja
e também não confiam em "guru de YouTube". Querem se sentir investidores
sérios sem precisar virar economista.

## Product Purpose

Plataforma única que junta o que o investidor brasileiro hoje precisa de
3-4 apps separados: tracking de carteira (ações, FIIs, RF), agenda de
dividendos, finanças pessoais, cursos estruturados, e uma comunidade de
investidores. O sucesso parece um usuário que entrou para "ver dividendos"
e seis meses depois ainda volta semanalmente porque virou o painel de
controle financeiro dele.

## Brand Personality

Três palavras: **mentor, sócio, paciente**.

A voz é metade professor experiente que explica antes de mandar
("vamos começar pelo básico, sem pressa") e metade sócio investidor
mais velho que vai direto ao ponto ("sua carteira tá 67% em RF, é por
isso que não oscila"). Nunca paternalizante, nunca seco. Confiante sem
ser arrogante. Premium sem ser elitista.

Estética aberta para reinterpretação: a versão atual (Playfair + ouro
saturado + preto) cai no reflexo previsível "finance + dark + gold".
Direções alternativas serão exploradas em DESIGN.md.

## Anti-references

Em ordem de gravidade:

- **SaaS B2B genérico**. Light mode indigo, hero-metric template, grids
  de cards idênticos com ícone + título + descrição. O atual "Acesso
  Rápido" da home é exatamente isso com gradientes saturados em cima.
- **Banco premium clichê** (Itaú Personnalité, BTG, "finance-dark-gold"
  genérico). Bege/dourado conservador parecendo site de banco de 2008.
  Inclui o próprio reflexo categoria → paleta atual.
- **Fintech gamificada** (Nubank, Inter, XP). Roxo/laranja chapado,
  ilustrações 3D, gamificação infantilizada, navbar inferior com ícones.
- **Status Invest cinza-planilha**. Funcional mas deprimente, zero
  hierarquia, parece export de Excel.

## Design Principles

1. **Educa antes de pedir.** Toda tela complexa ensina quem é iniciante
   (tooltip, expander, glossário inline) sem entupir quem é avançado.
   Densidade revelada, nunca imposta.

2. **Densidade que cresce com o usuário.** Iniciante vê 3 KPIs e um CTA
   claro. Avançado destrava screener, comparações, exportações. Mesma
   tela, camadas diferentes.

3. **Patrimônio se constrói com paciência.** Anti-urgência por design.
   Sem números piscando, sem CTAs de FOMO ("compre agora!"), sem
   gamificação de retenção. Calma é a feature.

4. **Premium sem ser banco antigo.** Luxo vem de tipografia, respiração
   e precisão, não de ouro saturado em todo elemento. O dourado
   aparece quando importa (conquista, identidade, hierarquia top),
   não como decoração ambiente.

5. **Mostra o trabalho.** Cada número tem origem clicável (de onde
   veio esse DY?). Educação e dados moram juntos. O usuário aprende
   USANDO, não em curso separado.

## Accessibility & Inclusion

Bom senso pragmático, sem auditoria WCAG AA formal:

- Contraste mínimo 4.5:1 em texto de corpo (a paleta atual reprova:
  `#6a5a3a` sobre `#0a0806` está em ~3.2:1, vai precisar clarear).
- Foco visível em todo elemento focável (anel dourado fino).
- `prefers-reduced-motion` respeitado para animações decorativas.
- Inputs sempre com `<label>` associado, mensagens de erro claras
  em PT-BR sem código de erro críptico.
- Tamanho de toque mínimo 40px em mobile.
- PT-BR como idioma único (sem i18n por enquanto).
