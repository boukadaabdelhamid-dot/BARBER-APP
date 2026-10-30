import { GoogleLogin } from "@react-oauth/google";

type GoogleAuthButtonProps = {
  testId: string;
  onCredential: (credential: string) => void;
  onError: () => void;
};

export function GoogleAuthButton({
  testId,
  onCredential,
  onError,
}: GoogleAuthButtonProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return (
      <div className="google-auth-control" data-testid={testId}>
        <button className="google-auth-unconfigured" type="button" disabled>
          Google · إعداد المعرف مطلوب
        </button>
      </div>
    );
  }

  return (
    <div className="google-auth-control" data-testid={testId}>
      <GoogleLogin
        onSuccess={(response) => {
          if (response.credential) onCredential(response.credential);
          else onError();
        }}
        onError={onError}
        useOneTap={false}
        theme="outline"
        text="continue_with"
        shape="rectangular"
        size="large"
        width="320"
      />
    </div>
  );
}
