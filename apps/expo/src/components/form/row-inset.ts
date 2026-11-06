import { createContext, useContext } from "react";

/**
 * True inside a form `custom` row that already pads its content
 * horizontally. On Android, `FieldGroup.Section` puts anything that isn't a
 * `ListItem` inside one, and Compose's `ListItem` padding can't be turned
 * off. Components that bring their own horizontal padding (and are also used
 * outside forms) should drop it when this is true
 */
export const FormRowInsetContext = createContext(false);

export const useFormRowInset = () => useContext(FormRowInsetContext);
