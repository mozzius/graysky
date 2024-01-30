import { Firehose } from "./firehose";

new Firehose((notification) => {
  console.log(notification);
});
