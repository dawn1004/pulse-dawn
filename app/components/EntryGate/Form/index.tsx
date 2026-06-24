"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { loadSavedProfile, saveProfile, clearProfile } from "@/lib/profile";
import type { SessionProfile } from "@/lib/profile";
import TurnstileWidget, {
  type TurnstileHandle,
} from "@/app/components/TurnstileWidget";
import { cn } from "@/lib/utils";
import ConfirmStep from "./ConfirmStep";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import StepIndicator from "./StepIndicator";
import { STEPS } from "./steps";

type FormProps = {
  onEnter: (profile: SessionProfile, turnstileToken: string) => void;
  locateStatus: "idle" | "locating" | "error";
  locateError: string;
};

export default function Form({
  onEnter,
  locateStatus,
  locateError,
}: FormProps) {
  const [initialized, setInitialized] = useState(false);
  const [phase, setPhase] = useState<"steps" | "confirm">("steps");
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [age18Plus, setAge18Plus] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [showConfirmError, setShowConfirmError] = useState(false);
  const [usingSavedProfile, setUsingSavedProfile] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const pendingEnterRef = useRef(false);

  useEffect(() => {
    const saved = loadSavedProfile();
    if (saved?.recoverData) {
      // Client-only restore after mount — avoids SSR/hydration mismatch with localStorage.
      /* eslint-disable react-hooks/set-state-in-effect -- intentional post-mount bootstrap */
      setNickname(saved.nickname);
      setAboutMe(saved.aboutMe);
      setAvatar(saved.avatar);
      setTags(saved.tags);
      setSaveInfo(true);
      setUsingSavedProfile(true);
      setStep(STEPS.length);
      setPhase("confirm");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setInitialized(true);
  }, []);

  const currentStep = STEPS[step - 1];
  const isConfirm = phase === "confirm";

  const canProceed =
    step === 1
      ? nickname.trim().length > 0
      : step === 2
      ? avatar.length > 0
      : tags.length > 0;

  const canEnter = agreePrivacy && age18Plus;

  const stepError =
    step === 1
      ? "Enter a nickname to continue."
      : step === 2
      ? "Pick a mood to continue."
      : "Select at least one interest.";

  const confirmError =
    !agreePrivacy && !age18Plus
      ? "Agree to the privacy policy and confirm you are 18 or older to enter."
      : !agreePrivacy
      ? "Agree to the privacy policy to enter."
      : "Confirm you are 18 or older to enter.";

  function handleNext() {
    if (!canProceed) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (step === STEPS.length) {
      setPhase("confirm");
      return;
    }
    setStep((s) => s + 1);
  }

  function handleBack() {
    setShowError(false);
    setShowConfirmError(false);
    setTurnstileError(false);
    setVerifying(false);
    pendingEnterRef.current = false;
    if (isConfirm) {
      setTurnstileToken(null);
      turnstileRef.current?.reset();
      setUsingSavedProfile(false);
      setPhase("steps");
      return;
    }
    setStep((s) => s - 1);
  }

  function handleClearSavedData() {
    clearProfile();
    setUsingSavedProfile(false);
    setNickname("");
    setAboutMe("");
    setAvatar("");
    setTags([]);
    setAgreePrivacy(false);
    setAge18Plus(false);
    setSaveInfo(false);
    setShowConfirmError(false);
    setShowError(false);
    setPhase("steps");
    setStep(1);
  }

  function proceedEnter(token: string) {
    setShowConfirmError(false);
    setTurnstileError(false);
    saveProfile({
      nickname: nickname.trim(),
      aboutMe: aboutMe.trim(),
      avatar,
      tags,
      recoverData: saveInfo,
    });
    onEnter(
      {
        nickname: nickname.trim(),
        aboutMe: aboutMe.trim(),
        avatar,
        tags,
      },
      token
    );
  }

  function handleTurnstileVerify(token: string) {
    setTurnstileToken(token);
    setVerifying(false);
    setTurnstileError(false);
    if (pendingEnterRef.current) {
      pendingEnterRef.current = false;
      proceedEnter(token);
    }
  }

  function handleTurnstileFail() {
    setTurnstileToken(null);
    setVerifying(false);
    if (pendingEnterRef.current) {
      pendingEnterRef.current = false;
      setTurnstileError(true);
    }
  }

  function handleEnter() {
    if (!canEnter) {
      setShowConfirmError(true);
      return;
    }

    if (turnstileToken) {
      proceedEnter(turnstileToken);
      return;
    }

    setShowConfirmError(false);
    setTurnstileError(false);
    setVerifying(true);
    pendingEnterRef.current = true;

    const started = turnstileRef.current?.execute();
    if (!started) {
      pendingEnterRef.current = false;
      setVerifying(false);
      setTurnstileError(true);
    }
  }

  if (!initialized) {
    return (
      <div className="w-full animate-pulse space-y-5 p-1">
        <div className="h-16 rounded-xl bg-muted/40" />
        <div className="h-px bg-border/60" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted/40" />
          <div className="h-4 w-48 rounded bg-muted/30" />
        </div>
        <div className="h-84 rounded-xl bg-muted/20" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="relative border-0 bg-transparent shadow-none ring-0">
        {isConfirm && (
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileFail}
            onError={handleTurnstileFail}
          />
        )}
        <CardHeader className="gap-5 pb-0">
          <StepIndicator step={step} complete={isConfirm} />

          <Separator className="bg-border/60" />

          <div className="space-y-1 pb-1">
            <CardTitle className="text-lg">
              {isConfirm
                ? usingSavedProfile
                  ? "Welcome back"
                  : "Almost there"
                : currentStep.label}
            </CardTitle>
            <CardDescription>
              {isConfirm
                ? usingSavedProfile
                  ? "Your saved profile is ready on this device. Confirm below to enter, edit it, or clear it to start over."
                  : "Review the guidelines below, then enter the globe."
                : currentStep.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="h-84 shrink-0 overflow-y-auto pt-4">
          {!isConfirm && step === 1 && (
            <Step1
              nickname={nickname}
              aboutMe={aboutMe}
              showError={showError}
              onNicknameChange={setNickname}
              onAboutMeChange={setAboutMe}
            />
          )}
          {!isConfirm && step === 2 && (
            <Step2 avatar={avatar} onAvatarChange={setAvatar} />
          )}
          {!isConfirm && step === 3 && (
            <Step3 tags={tags} onTagsChange={setTags} />
          )}
          {isConfirm && (
            <ConfirmStep
              usingSavedProfile={usingSavedProfile}
              nickname={nickname}
              aboutMe={aboutMe}
              avatar={avatar}
              tags={tags}
              agreePrivacy={agreePrivacy}
              age18Plus={age18Plus}
              saveInfo={saveInfo}
              showConfirmError={showConfirmError}
              onAgreePrivacyChange={(checked) => {
                setAgreePrivacy(checked);
                if (checked && age18Plus) setShowConfirmError(false);
              }}
              onAge18PlusChange={(checked) => {
                setAge18Plus(checked);
                if (checked && agreePrivacy) setShowConfirmError(false);
              }}
              onSaveInfoChange={setSaveInfo}
              onClearSavedData={handleClearSavedData}
            />
          )}
        </CardContent>

        <Separator className="bg-border/60" />

        <CardFooter className="flex-col gap-3 pt-4">
          <div className="min-h-5 w-full">
            {!isConfirm && showError && !canProceed && (
              <FieldError className="w-full">{stepError}</FieldError>
            )}
            {isConfirm && showConfirmError && !canEnter && (
              <FieldError className="w-full">{confirmError}</FieldError>
            )}
            {isConfirm && locateStatus === "error" && (
              <p className="text-sm text-destructive">{locateError}</p>
            )}
            {isConfirm && turnstileError && (
              <FieldError className="w-full">
                Security check failed. Please try again.
              </FieldError>
            )}
          </div>

          <div className="flex w-full gap-2">
            {(step > 1 || isConfirm) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="rounded-full border-border"
              >
                <ChevronLeft className="size-4" />
                {isConfirm && usingSavedProfile ? "Edit profile" : "Back"}
              </Button>
            )}
            {step === 1 && !isConfirm && <div />}

            <div className="flex-1" />

            {!isConfirm && step < STEPS.length && (
              <Button
                type="button"
                onClick={handleNext}
                className={cn("rounded-full", !canProceed && "opacity-50")}
                size="lg"
              >
                Continue
                <ChevronRight className="size-4" />
              </Button>
            )}

            {!isConfirm && step === STEPS.length && (
              <Button
                type="button"
                onClick={handleNext}
                className={cn("rounded-full", !canProceed && "opacity-50")}
                size="lg"
              >
                Done
                <Check className="size-4" />
              </Button>
            )}

            {isConfirm && (
              <Button
                type="button"
                onClick={handleEnter}
                disabled={locateStatus === "locating" || verifying}
                className={cn(
                  "rounded-full",
                  !canEnter && showConfirmError && "opacity-50"
                )}
                size="lg"
              >
                {locateStatus === "locating"
                  ? "Locating…"
                  : verifying
                    ? "Verifying…"
                    : "Enter Pulse"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
