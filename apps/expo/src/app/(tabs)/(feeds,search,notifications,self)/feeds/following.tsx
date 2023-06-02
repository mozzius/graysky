import { ComposeButton } from "../../../../components/compose-button";
import { FeedScreen } from "../../../../components/screens/feed-screen";

export default function FeedPage() {
  return (
    <>
      <FeedScreen feed="following" />
      <ComposeButton />
    </>
  );
}
