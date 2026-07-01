import i18n from '@/i18n'

/**
 * Datas localizadas via Intl.DateTimeFormat (sem manter arrays de mês/semana em cada idioma). Lê o idioma
 * atual do i18n a cada chamada — usado dentro de componentes que re-renderizam na troca de idioma.
 * O pt-BR sai IDÊNTICO aos arrays que substituiu (ver datetime.test.ts): "Junho"/"Jun"/"Seg"/data longa.
 */
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const fmt = (opts: Intl.DateTimeFormatOptions, date: Date) => new Intl.DateTimeFormat(i18n.language, opts).format(date)

/** Mês por extenso, capitalizado: "Junho" / "June" / "Junio". */
export const mesLongo = (m: number) => cap(fmt({ month: 'long' }, new Date(2020, m, 1)))

/** Mês abreviado (3 letras, capitalizado, sem ponto): "Jun". */
export const mesAbrev = (m: number) => cap(fmt({ month: 'short' }, new Date(2020, m, 1)).replace('.', '')).slice(0, 3)

/** Dias da semana curtos, começando na SEGUNDA: ["Seg","Ter",…,"Dom"] (2024-01-01 foi uma segunda). */
export const semanaCurta = () => Array.from({ length: 7 }, (_, i) => cap(fmt({ weekday: 'short' }, new Date(2024, 0, 1 + i)).replace('.', '')))

/** Nome curto do dia da semana por índice getDay (0=Dom … 6=Sáb), capitalizado, sem ponto: "Qua". (2024-01-07 foi um domingo.) */
export const diaSemanaCurto = (d: number) => cap(fmt({ weekday: 'short' }, new Date(2024, 0, 7 + d)).replace('.', ''))

/** Nome longo do dia da semana por índice getDay (0=Dom … 6=Sáb), capitalizado: "Quarta-feira". */
export const diaSemanaLongo = (d: number) => cap(fmt({ weekday: 'long' }, new Date(2024, 0, 7 + d)))

/** Nome de exibição do dia (sem o sufixo "-feira" do pt-BR): "Segunda" / "Monday" / "Lunes". */
export const diaSemanaNome = (d: number) => cap(fmt({ weekday: 'long' }, new Date(2024, 0, 7 + d)).replace(/-feira$/i, ''))

/** Data longa: "segunda-feira, 16 de junho de 2026" / "Monday, June 16, 2026" / "lunes, 16 de junio de 2026". */
export const dataLonga = (y: number, m: number, d: number) => fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, new Date(y, m, d))

/** Data média (sem dia da semana): "18 de junho de 2026" / "June 18, 2026" / "18 de junio de 2026". */
export const dataMedia = (y: number, m: number, d: number) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }, new Date(y, m, d))

/** Número agrupado por locale (ex.: 1.234 / 1,234). */
export const formatNumber = (n: number) => new Intl.NumberFormat(i18n.language).format(n)

/** Moeda BRL formatada por locale (a moeda do recrutamento é sempre BRL; muda só o agrupamento). */
export const formatBRL = (n: number) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'BRL' }).format(n)
