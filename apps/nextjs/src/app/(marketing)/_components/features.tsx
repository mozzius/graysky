import {
  CloudyIcon,
  HashIcon,
  HeartIcon,
  LanguagesIcon,
  MoreHorizontalIcon,
  TicketIcon,
  // TvIcon,
  type LucideIcon,
} from "lucide-react";

export const Features = () => {
  return (
    <div className="container mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2 md:grid-cols-3">
      <FeatureCard
        title="Translations"
        description="Translate posts without leaving the app"
        icon={LanguagesIcon}
      />
      {/* <FeatureCard
        title="GIFs"
        description="View and post animated GIFs - exclusive to Graysky"
        icon={TvIcon}
      /> */}
      <FeatureCard
        title="View likes"
        description="View anyone's likes, not just your own"
        icon={HeartIcon}
      />
      <FeatureCard
        title="Hashtag support"
        description="Post hashtags - they're clickable too!"
        icon={HashIcon}
      />
      <FeatureCard
        title="Feed-first design"
        description="Browse and manage your custom feeds"
        icon={CloudyIcon}
      />
      <FeatureCard
        title="See your invitees"
        description="See who you've invited to Bluesky"
        icon={TicketIcon}
      />
      <FeatureCard
        title="And more..."
        description="To be announced!"
        icon={MoreHorizontalIcon}
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
