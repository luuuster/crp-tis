import * as React from "react"
import { CalendarDays } from "lucide-react"
import { format, isValid, parse } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// DatePicker do DS: campo digitável (pt-BR, máscara dd/mm/aaaa) + calendário ESTILIZADO nos tokens do
// DS (react-day-picker via ui/calendar) num Popover ancorado sob o campo. Substitui o <input type="date">
// nativo (cujo calendário o navegador desenha e NÃO é estilizável). `value`/`onChange` usam ISO
// 'yyyy-MM-dd' p/ casar com a lógica de formulário existente. Clicar no campo OU no ícone abre o
// calendário; o foco permanece no campo (onOpenAutoFocus prevenido) para continuar DIGITANDO.
function DatePicker({ id, value, onChange, placeholder = "dd/mm/aaaa", disabled, className }: {
  id?: string
  value: string
  onChange: (iso: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined
  const selected = parsed && isValid(parsed) ? parsed : undefined
  const [texto, setTexto] = React.useState(selected ? format(selected, "dd/MM/yyyy") : "")

  // Sincroniza o texto quando `value` muda POR FORA (ex.: botão "ir para a próxima data livre"). Só age quando
  // o ISO de `value` difere do que o texto já representa — não briga com a digitação: ao digitar uma data
  // completa, `value` passa a igualar o texto (sem-op); em data parcial/apagando, `value` não muda (efeito nem roda).
  React.useEffect(() => {
    const atual = (() => { const d = parse(texto, "dd/MM/yyyy", new Date()); return isValid(d) ? format(d, "yyyy-MM-dd") : "" })()
    if (value !== atual) setTexto(selected ? format(selected, "dd/MM/yyyy") : "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Máscara: reformata a partir dos dígitos (auto-insere as barras). Emite o ISO só quando completo e válido.
  function digitar(raw: string) {
    const dig = raw.replace(/\D/g, "").slice(0, 8)
    const t = dig.length > 4 ? `${dig.slice(0, 2)}/${dig.slice(2, 4)}/${dig.slice(4)}` : dig.length > 2 ? `${dig.slice(0, 2)}/${dig.slice(2)}` : dig
    setTexto(t)
    if (dig.length === 0) return onChange("")
    if (dig.length === 8) {
      const d = parse(t, "dd/MM/yyyy", new Date())
      if (isValid(d)) onChange(format(d, "yyyy-MM-dd"))
    }
  }
  function selecionar(d?: Date) {
    if (!d) return
    onChange(format(d, "yyyy-MM-dd"))
    setTexto(format(d, "dd/MM/yyyy"))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            id={id}
            value={texto}
            onChange={(e) => digitar(e.target.value)}
            onClick={() => !disabled && setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="off"
            className={cn("pr-10", className)}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              aria-label="Abrir calendário"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <CalendarDays aria-hidden />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={selecionar} locale={ptBR} />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
