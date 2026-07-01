import { Text, TextInput } from 'react-native';
import { Typography } from './typography';

type ComponentWithDefaultStyle = {
  defaultProps?: {
    style?: unknown;
  };
};

let applied = false;

export function applySystemTypography() {
  if (applied) return;
  applied = true;

  const text = Text as unknown as ComponentWithDefaultStyle;
  const textInput = TextInput as unknown as ComponentWithDefaultStyle;

  text.defaultProps = text.defaultProps ?? {};
  text.defaultProps.style = [{ fontFamily: Typography.body }, text.defaultProps.style];

  textInput.defaultProps = textInput.defaultProps ?? {};
  textInput.defaultProps.style = [{ fontFamily: Typography.body }, textInput.defaultProps.style];
}
