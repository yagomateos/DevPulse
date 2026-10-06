'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ROLE_DESCRIPTIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { ROLES } from '@/types/domain';
import { login } from '../actions';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@example.com', password: 'demo123', role: 'ADMIN' },
  });

  const onSubmit = (values: LoginInput) => {
    setFormError(null);
    startTransition(async () => {
      const result = await login(values, next);
      if (result.ok) {
        router.replace(result.redirectTo);
        router.refresh();
        return;
      }
      setFormError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as keyof LoginInput, { message });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-9" {...field} />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Demo role</FormLabel>
              <FormDescription>Explore role-based access control. You can switch later from the user menu.</FormDescription>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
                  {ROLES.map((role) => (
                    <label
                      key={role}
                      title={ROLE_DESCRIPTIONS[role]}
                      className={cn(
                        'flex cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-medium transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                        field.value === role && 'border-primary bg-primary/10 text-foreground',
                      )}
                    >
                      <RadioGroupItem value={role} className="sr-only" />
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" loading={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
}
