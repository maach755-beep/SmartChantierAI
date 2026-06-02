import { Card } from '../ui/Card';
import { SafeChart } from './SafeChart';

interface ChartContainerProps {
  title: string;
  children: React.ReactElement;
  height?: number;
  className?: string;
}

export function ChartContainer({ title, children, height = 260, className = '' }: ChartContainerProps) {
  return (
    <Card title={title} className={className}>
      <SafeChart height={height}>{children}</SafeChart>
    </Card>
  );
}
