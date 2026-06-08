// CRP DS — <Icon> (React). REFERÊNCIA p/ copiar no app React (este repo é só tokens; aqui não compila
// porque não tem react/lucide-react instalados — é esperado).
//
// Paridade 1:1 com o componente `lucide/<nome>` do Figma:
//   • Mesmos nomes (kebab-case Lucide): "arrow-right", "chevron-down"…  (= a SET name no Figma)
//   • size 16/20/24/32  (= primitivos icon/sm…icon/xl) — default 20px (= variante padrão do set no Figma)
//   • stroke ABSOLUTO por tamanho: 16/20 → 1.5px, 24 → 2px, 32 → 3px  (= o bind do Figma em border-width/*)
//   • cor = currentColor (herda) — aponte p/ o seu token, ex.: style={{ color: 'var(--primary-foreground)' }}
//
// Requer no app:  npm i lucide-react   (DynamicIcon: lucide-react ≥ ~0.290)

import { DynamicIcon, dynamicIconImports } from 'lucide-react/dynamic';
import type { ComponentProps } from 'react';

// Tipo dos nomes derivado da própria lib (version-safe — não depende do export `IconName`).
export type IconName = keyof typeof dynamicIconImports;
export type IconSize = 16 | 20 | 24 | 32;

// Stroke ABSOLUTO em px por tamanho — espelha o que o plugin liga em border-width/* no Figma.
const ABS_STROKE: Record<number, number> = { 16: 1.5, 20: 1.5, 24: 2, 32: 3 };

export interface IconProps extends Omit<ComponentProps<typeof DynamicIcon>, 'name' | 'size'> {
  /** kebab-case, idêntico ao Figma: "arrow-right", "chevron-down", "user"… */
  name: IconName;
  size?: IconSize | number;
}

export function Icon({ name, size = 20, strokeWidth, ...rest }: IconProps) {
  // O Lucide usa strokeWidth em unidades do viewBox (24), que ESCALA com o size (W·size/24 px efetivos).
  // Convertendo o stroke ABSOLUTO (px) p/ bater com o Figma:  sw = abs · 24 / size.
  const abs = ABS_STROKE[size] ?? 2;
  const sw = strokeWidth ?? (abs * 24) / size;
  return <DynamicIcon name={name} size={size} strokeWidth={sw} {...rest} />;
}

export default Icon;
