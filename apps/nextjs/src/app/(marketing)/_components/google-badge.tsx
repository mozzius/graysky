/* eslint-disable @next/next/no-img-element */
interface Props {
  className?: string;
}

export const GoogleBadge = ({ className }: Props) => {
  return (
    <a
      href="https://play.google.com/store/apps/details?id=dev.mozzius.graysky&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"
      className={className}
    >
      <img
        alt="Get it on Google Play"
        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
        height={250 / 3}
        width={646 / 3}
      />
    </a>
  );
};
