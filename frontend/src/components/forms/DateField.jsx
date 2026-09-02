import TextField from "./TextField";

/** Date input. Thin wrapper over TextField so it keeps the same label / error
 *  wiring; `warning` is used to flag past dates without blocking submit. */
export default function DateField(props) {
  return <TextField type="date" {...props} />;
}
