"use client"

import React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { profileSettingsSchema, type ProfileSettingsFormValues } from "@/lib/formSchemas"
import { BLOCKCHAIN_NETWORKS, type BlockchainNetwork } from "@/types/property"

interface ProfileSettingsFormProps {
  initialValues?: ProfileSettingsFormValues
  onSubmit: (values: ProfileSettingsFormValues) => void
}

const defaultValues: ProfileSettingsFormValues = {
  displayName: "",
  email: "",
  phoneNumber: "",
  preferredNetwork: "ethereum",
  receiveNewsletter: false,
}

export function ProfileSettingsForm({ initialValues = defaultValues, onSubmit }: ProfileSettingsFormProps) {
  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Keep your profile information up to date for wallet-backed account access.</p>
        </div>

        <FormItem>
          <FormLabel>Display name</FormLabel>
          <FormControl>
            <Input {...form.register("displayName")} />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Email address</FormLabel>
          <FormControl>
            <Input type="email" {...form.register("email")} />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Phone number</FormLabel>
          <FormControl>
            <Input type="tel" {...form.register("phoneNumber")} />
          </FormControl>
          <FormDescription>Optional. Include country code if applicable.</FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Preferred network</FormLabel>
          <FormControl>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-ring/50"
              {...form.register("preferredNetwork")}
            >
              {(BLOCKCHAIN_NETWORKS as BlockchainNetwork[]).map((chain) => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Receive product updates</FormLabel>
          <FormControl>
            <Controller
              control={form.control}
              name="receiveNewsletter"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </FormControl>
          <FormDescription>Enable email notifications for new property drops and platform announcements.</FormDescription>
          <FormMessage />
        </FormItem>

        <Button type="submit">Save profile</Button>
      </form>
    </Form>
  )
}
