import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Step1Props = {
  nickname: string;
  aboutMe: string;
  showError: boolean;
  onNicknameChange: (value: string) => void;
  onAboutMeChange: (value: string) => void;
};

export default function Step1({
  nickname,
  aboutMe,
  showError,
  onNicknameChange,
  onAboutMeChange,
}: Step1Props) {
  return (
    <FieldSet>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="nickname">Nickname *</FieldLabel>
          <FieldDescription>
            What should strangers call you on the map?
          </FieldDescription>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="e.g. Luna, Alex, Wanderer…"
            maxLength={24}
            aria-invalid={showError && !nickname.trim()}
            className="h-10 border-border bg-muted/30"
          />
          <p className="text-right text-xs tabular-nums text-muted-foreground/70">
            {nickname.length}/24
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="about-me">About me</FieldLabel>
          <FieldDescription>
            A short intro so people know if it&apos;s nice to talk with you.
          </FieldDescription>
          <Textarea
            id="about-me"
            value={aboutMe}
            onChange={(e) => onAboutMeChange(e.target.value)}
            placeholder="I love late-night chats about music and travel…"
            rows={3}
            maxLength={160}
            className="min-h-20 resize-none border-border bg-muted/30"
          />
          <p className="text-right text-xs tabular-nums text-muted-foreground/70">
            {aboutMe.length}/160
          </p>
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
