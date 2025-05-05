import { ReactNode } from 'react';
import { H1 } from './typography';

export const PageHeader = ({
  title,
  timeEstimateInMinutes,
  action,
}: {
  title: string;
  timeEstimateInMinutes?: number;
  action?: ReactNode;
}) => {
  return (
    <header className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
      <H1>
        {title}{' '}
        {timeEstimateInMinutes && (
          <span className="font-normal text-gray-500">
            (ca. {timeEstimateInMinutes} Min.)
          </span>
        )}
      </H1>
      {action && <div className="mt-3 sm:ml-4 sm:mt-0">{action}</div>}
    </header>
  );
};
