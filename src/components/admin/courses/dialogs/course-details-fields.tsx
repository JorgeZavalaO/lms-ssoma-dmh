"use client"

import * as React from "react"
import { AlertCircle, BookOpen, CheckCircle2, Clock, Users } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type UseFormReturn } from "react-hook-form"
import {
  CourseFormData,
  CourseModalityEnum,
  CourseStatusEnum,
} from "@/validations/courses"

type CourseStatus = CourseFormData["status"]
type CourseModality = CourseFormData["modality"]

type CourseDetailsFieldsProps = {
  form: UseFormReturn<CourseFormData>
  includeCodeField?: boolean
  placeholders?: {
    name?: string
    objective?: string
    description?: string
    requirements?: string
    duration?: string
    validity?: string
  }
}

const statusOptions: Array<{ value: CourseStatus; label: string; dotClass: string }> = [
  { value: "DRAFT", label: "Borrador", dotClass: "bg-slate-400" },
  { value: "PUBLISHED", label: "Publicado", dotClass: "bg-emerald-500" },
  { value: "ARCHIVED", label: "Archivado", dotClass: "bg-slate-300" },
]

const modalityOptions: Array<{ value: CourseModality; label: string }> = [
  { value: "ASYNCHRONOUS", label: "Asíncrono" },
  { value: "SYNCHRONOUS", label: "Síncrono" },
  { value: "BLENDED", label: "Mixto" },
]

export function CourseDetailsFields({
  form,
  includeCodeField = false,
  placeholders,
}: CourseDetailsFieldsProps) {
  const handleStatusChange = React.useCallback(
    (value: string) => {
      const parsed = CourseStatusEnum.safeParse(value)
      if (parsed.success) {
        form.setValue("status", parsed.data, { shouldDirty: true })
      }
    },
    [form]
  )

  const handleModalityChange = React.useCallback(
    (value: string) => {
      const parsed = CourseModalityEnum.safeParse(value)
      if (parsed.success) {
        form.setValue("modality", parsed.data, { shouldDirty: true })
      }
    },
    [form]
  )

  return (
    <div className="space-y-6">
      {includeCodeField ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-500" />
            <Label className="font-semibold">Identificación del Curso</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm text-slate-600">
                Código *
              </Label>
              <Input
                id="code"
                {...form.register("code")}
                className="border-slate-200 focus:border-emerald-500"
              />
            </div>
            <CourseStatusSelect
              value={form.watch("status")}
              onChange={handleStatusChange}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-slate-500" />
            <Label htmlFor="status" className="font-semibold">
              Estado
            </Label>
          </div>
          <CourseStatusSelect
            value={form.watch("status")}
            onChange={handleStatusChange}
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <Label htmlFor="name" className="font-semibold">
            Nombre del Curso *
          </Label>
        </div>
        <Input
          id="name"
          {...form.register("name")}
          placeholder={placeholders?.name}
          className="border-slate-200 focus:border-emerald-500"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-slate-500" />
          <Label htmlFor="objective" className="font-semibold">
            Objetivo
          </Label>
        </div>
        <Textarea
          id="objective"
          rows={2}
          {...form.register("objective")}
          placeholder={placeholders?.objective}
          className="border-slate-200 focus:border-emerald-500 resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <Label htmlFor="description" className="font-semibold">
            Descripción
          </Label>
        </div>
        <Textarea
          id="description"
          rows={3}
          {...form.register("description")}
          placeholder={placeholders?.description}
          className="border-slate-200 focus:border-emerald-500 resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <Label className="font-semibold">Configuración de Tiempo</Label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm text-slate-600">
              Duración (horas)
            </Label>
            <Input
              id="duration"
              type="number"
              placeholder={placeholders?.duration}
              {...form.register("duration", { valueAsNumber: true })}
              className="border-slate-200 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modality" className="text-sm text-slate-600">
              Modalidad
            </Label>
            <Select
              value={form.watch("modality")}
              onValueChange={handleModalityChange}
            >
              <SelectTrigger className="border-slate-200 focus:border-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modalityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="validity" className="text-sm text-slate-600">
              Vigencia (meses)
            </Label>
            <Input
              id="validity"
              type="number"
              placeholder={placeholders?.validity}
              {...form.register("validity", { valueAsNumber: true })}
              className="border-slate-200 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-500" />
          <Label htmlFor="requirements" className="font-semibold">
            Requisitos Previos
          </Label>
        </div>
        <Textarea
          id="requirements"
          rows={2}
          {...form.register("requirements")}
          placeholder={placeholders?.requirements}
          className="border-slate-200 focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  )
}

type CourseStatusSelectProps = {
  value: CourseStatus
  onChange: (value: string) => void
}

function CourseStatusSelect({ value, onChange }: CourseStatusSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="border-slate-200 focus:border-emerald-500">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${option.dotClass}`} />
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
