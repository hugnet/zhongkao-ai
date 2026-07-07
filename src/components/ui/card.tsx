import { cn } from '@/lib/utils';

export function Card(props: any) {
  var { className, children, ...rest } = props;
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white shadow-sm", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader(props: any) {
  return <div className={cn("p-6 pb-0", props.className)}>{props.children}</div>;
}

export function CardTitle(props: any) {
  return <h3 className={cn('text-lg font-semibold text-gray-900', props.className)}>{props.children}</h3>;
}

export function CardContent(props: any) {
  return <div className={cn("p-6", props.className)}>{props.children}</div>;
}