import {
  HeartIcon,
  LanguagesIcon,
  TvIcon,
  type LucideIcon,
} from "lucide-react";

export const Features = () => {
  return (
    <div className="container mx-auto mt-8 grid max-w-xs gap-4 md:max-w-3xl md:grid-cols-3">
      <FeatureCard
        title="Translations"
        description="Translate posts without leaving the app"
        icon={LanguagesIcon}
      />
      <FeatureCard
        title="GIFs"
        description="View and post animated GIFs - exclusive to Graysky"
        icon={TvIcon}
      />
      <FeatureCard
        title="View likes"
        description="View anyone's likes, not just your own"
        icon={HeartIcon}
      />
    </div>
  );
};

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FeatureCard = ({ title, description, icon: Icon }: Props) => {
  return (
    <div className="flex flex-row rounded border border-neutral-600 p-2">
      <Icon size={24} opacity={0.5} className="shrink-0" />
      <div className="flex flex-col px-2">
        <h4>{title}</h4>
        <p className="text-sm opacity-50">{description}</p>
      </div>
    </div>
  );
};
