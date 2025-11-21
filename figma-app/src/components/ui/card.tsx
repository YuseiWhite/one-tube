import * as React from "react";
import { figma } from "@figma/code-connect";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};

// Figma Code Connect
figma.connect(Card, {
  props: {
    children: figma.children("Card Content"),
  },
  example: (props) => <Card {...props} />,
});

figma.connect(CardHeader, {
  props: {
    children: figma.children("Header Content"),
  },
  example: (props) => <CardHeader {...props} />,
});

figma.connect(CardTitle, {
  props: {
    children: figma.children("Title Text"),
  },
  example: (props) => <CardTitle {...props} />,
});

figma.connect(CardDescription, {
  props: {
    children: figma.children("Description Text"),
  },
  example: (props) => <CardDescription {...props} />,
});

figma.connect(CardContent, {
  props: {
    children: figma.children("Content"),
  },
  example: (props) => <CardContent {...props} />,
});

figma.connect(CardFooter, {
  props: {
    children: figma.children("Footer Content"),
  },
  example: (props) => <CardFooter {...props} />,
});
