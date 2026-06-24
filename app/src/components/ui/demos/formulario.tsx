import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from '@/components/ui/combobox'
import { Calendar } from '@/components/ui/calendar'
import { DatePicker } from '@/components/ui/date-picker'
import type { Demo } from './_types'

const FRUTAS = ['Maçã', 'Banana', 'Laranja', 'Uva', 'Manga', 'Abacaxi']

function FormDemo() {
  const form = useForm<{ email: string }>({ defaultValues: { email: '' } })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="max-w-sm space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input type="email" placeholder="voce@empresa.com" {...field} /></FormControl>
              <FormDescription>Nunca compartilhamos seu e-mail.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Salvar</Button>
      </form>
    </Form>
  )
}

function ComboboxDemo() {
  return (
    <Combobox items={FRUTAS}>
      <ComboboxInput placeholder="Buscar fruta…" aria-label="Buscar fruta" showTrigger={false} className="max-w-xs" />
      <ComboboxContent>
        <ComboboxEmpty>Nenhuma fruta encontrada.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function DatePickerDemo() {
  const [value, setValue] = useState('')
  return <div className="max-w-xs"><DatePicker value={value} onChange={setValue} /></div>
}

function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 16))
  return <Calendar mode="single" selected={date} onSelect={setDate} className="w-fit rounded-md border" />
}

export const FORMULARIO_DEMOS: Demo[] = [
  {
    id: 'input', component: 'input', section: 'formulario', title: 'Input',
    Render: () => (
      <div className="grid max-w-xs gap-2">
        <Label htmlFor="d-email">E-mail</Label>
        <Input id="d-email" type="email" placeholder="voce@empresa.com" />
      </div>
    ),
  },
  {
    id: 'textarea', component: 'textarea', section: 'formulario', title: 'Textarea',
    Render: () => (
      <div className="grid max-w-sm gap-2">
        <Label htmlFor="d-bio">Bio</Label>
        <Textarea id="d-bio" placeholder="Conte um pouco sobre você…" />
      </div>
    ),
  },
  {
    id: 'label', component: 'label', section: 'formulario', title: 'Label',
    desc: 'Rótulo associado a um controle (clicar foca/ativa).',
    Render: () => (
      <label className="flex items-center gap-2" htmlFor="d-termos">
        <Checkbox id="d-termos" defaultChecked />
        <Label htmlFor="d-termos">Aceito os termos</Label>
      </label>
    ),
  },
  {
    id: 'field', component: 'field', section: 'formulario', title: 'Field',
    desc: 'Campo com label, descrição e erro; estado inválido tematizado.',
    Render: () => (
      <FieldGroup className="max-w-sm">
        <Field>
          <FieldLabel htmlFor="d-nome">Nome</FieldLabel>
          <Input id="d-nome" placeholder="Seu nome" />
          <FieldDescription>Como aparece no seu perfil.</FieldDescription>
        </Field>
        <Field data-invalid>
          <FieldLabel htmlFor="d-cep">CEP</FieldLabel>
          <Input id="d-cep" defaultValue="000" aria-invalid />
          <FieldError>CEP inválido — use 8 dígitos.</FieldError>
        </Field>
      </FieldGroup>
    ),
  },
  {
    id: 'form', component: 'form', section: 'formulario', title: 'Form',
    desc: 'Integração com react-hook-form (label/descrição/erro ligados ao estado).',
    Render: FormDemo,
  },
  {
    id: 'select', component: 'select', section: 'formulario', title: 'Select',
    desc: 'Seletor Radix (combobox → listbox).',
    Render: () => (
      <div className="grid max-w-xs gap-2">
        <Label htmlFor="d-cargo">Cargo</Label>
        <Select>
          <SelectTrigger id="d-cargo" aria-label="Cargo (select)"><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rh">RH</SelectItem>
            <SelectItem value="eng">Engenharia</SelectItem>
            <SelectItem value="design">Design</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
  },
  {
    id: 'combobox', component: 'combobox', section: 'formulario', title: 'Combobox',
    desc: 'Campo com busca + lista (base-ui); filtra ao digitar.',
    Render: ComboboxDemo,
  },
  {
    id: 'checkbox', component: 'checkbox', section: 'formulario', title: 'Checkbox',
    Render: () => (
      <div className="space-y-3">
        <label className="flex items-center gap-2" htmlFor="d-lembrar"><Checkbox id="d-lembrar" defaultChecked /><span className="text-sm">Lembrar de mim</span></label>
        <label className="flex items-center gap-2" htmlFor="d-news"><Checkbox id="d-news" /><span className="text-sm">Receber novidades</span></label>
        <label className="flex items-center gap-2 opacity-60" htmlFor="d-off"><Checkbox id="d-off" disabled /><span className="text-sm">Indisponível</span></label>
      </div>
    ),
  },
  {
    id: 'switch', component: 'switch', section: 'formulario', title: 'Switch',
    Render: () => (
      <div className="space-y-3">
        <label className="flex items-center gap-2" htmlFor="d-notif"><Switch id="d-notif" defaultChecked /><span className="text-sm">Notificações por e-mail</span></label>
        <label className="flex items-center gap-2" htmlFor="d-2fa"><Switch id="d-2fa" /><span className="text-sm">Autenticação em dois fatores</span></label>
      </div>
    ),
  },
  {
    id: 'radio-group', component: 'radio-group', section: 'formulario', title: 'Radio Group',
    Render: () => (
      <RadioGroup defaultValue="mensal" className="flex gap-6">
        <label className="flex items-center gap-2" htmlFor="d-mensal"><RadioGroupItem value="mensal" id="d-mensal" /><span className="text-sm">Mensal</span></label>
        <label className="flex items-center gap-2" htmlFor="d-anual"><RadioGroupItem value="anual" id="d-anual" /><span className="text-sm">Anual</span></label>
      </RadioGroup>
    ),
  },
  {
    id: 'slider', component: 'slider', section: 'formulario', title: 'Slider',
    Render: () => (
      <div className="max-w-sm space-y-2">
        <Label id="d-vol-label">Volume</Label>
        <Slider defaultValue={[40]} max={100} step={1} aria-labelledby="d-vol-label" />
      </div>
    ),
  },
  {
    id: 'input-group', component: 'input-group', section: 'formulario', title: 'Input Group',
    desc: 'Campo com addons (ícone/texto/botão).',
    Render: () => (
      <div className="grid max-w-xs gap-2">
        <Label htmlFor="d-busca">Buscar</Label>
        <InputGroup>
          <InputGroupAddon><Search /></InputGroupAddon>
          <InputGroupInput id="d-busca" placeholder="Buscar candidato…" />
        </InputGroup>
      </div>
    ),
  },
  {
    id: 'input-otp', component: 'input-otp', section: 'formulario', title: 'Input OTP',
    desc: 'Campo de código (dígitos avançam, backspace volta).',
    Render: () => (
      <div className="grid gap-2">
        <Label htmlFor="d-otp">Código de verificação</Label>
        <InputOTP id="d-otp" maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    ),
  },
  {
    id: 'date-picker', component: 'date-picker', section: 'formulario', title: 'Date Picker',
    desc: 'Campo digitável + calendário em popover.',
    Render: DatePickerDemo,
  },
  {
    id: 'calendar', component: 'calendar', section: 'formulario', title: 'Calendar',
    desc: 'Calendário inline (react-day-picker); setas navegam dias.',
    Render: CalendarDemo,
  },
]
