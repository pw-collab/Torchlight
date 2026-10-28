import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Torchlight's button set (Figma component set 64-849) on top of lyra:
// uppercase Libre Franklin Bold (the label family), square corners. `default`
// is the solid ember action (Figma Primary), `secondary` the quiet ruled
// button, `hollow` the ember outline. `muted` and `spirit` are the Figma's
// Muted and Secondary styles: a dark fill or the cyan, inside the 2px ink line.
const buttonVariants = cva(
  "cn-button group/button font-mono font-bold inline-flex shrink-0 items-center justify-center whitespace-nowrap tracking-[0.08em] uppercase transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "cn-button-variant-default",
        outline: "cn-button-variant-outline",
        secondary: "cn-button-variant-secondary border-input-border",
        ghost: "cn-button-variant-ghost",
        destructive: "cn-button-variant-destructive",
        hollow: "text-primary-text border-primary-text hover:bg-primary/10",
        muted: "bg-muted text-foreground border-2 border-border-frame hover:border-border-control aria-expanded:border-border-control",
        spirit: "bg-spirit text-spirit-foreground border-2 border-border-frame hover:bg-spirit/85",
        link: "cn-button-variant-link",
      },
      size: {
        default: "cn-button-size-default px-4 text-sm",
        xs: "cn-button-size-xs",
        sm: "cn-button-size-sm",
        lg: "cn-button-size-lg px-5 text-base",
        icon: "cn-button-size-icon",
        "icon-xs": "cn-button-size-icon-xs",
        "icon-sm": "cn-button-size-icon-sm",
        "icon-lg": "cn-button-size-icon-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
