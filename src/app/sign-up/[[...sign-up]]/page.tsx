import { SignUp } from "@clerk/nextjs";
import { AuthVisual } from "@/components/AuthVisual";
import styles from "../../auth.module.css";

export default function SignUpPage() {
  const taglineText = "Deploy your custom budget configurations and track details in under a minute.";

  return (
    <div className={styles.container}>
      <AuthVisual tagline={taglineText} />
      
      <main className={styles.authSide}>
        <div className={styles.mobileHeader}>
          <span className={styles.mark}>▸</span>
          <span className={styles.wordmark}>MIZAN</span>
          <p className={styles.tagline}>{taglineText}</p>
        </div>
        <SignUp />
      </main>
    </div>
  );
}
