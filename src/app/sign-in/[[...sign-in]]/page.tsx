import { SignIn } from "@clerk/nextjs";
import { AuthVisual } from "@/components/AuthVisual";
import styles from "../../auth.module.css";

export default function SignInPage() {
  const taglineText = "Know exactly what is safe to spend today. Take off with visual personal finance.";

  return (
    <div className={styles.container}>
      <AuthVisual tagline={taglineText} />
      
      <main className={styles.authSide}>
        <div className={styles.mobileHeader}>
          <span className={styles.mark}>▸</span>
          <span className={styles.wordmark}>MIZAN</span>
          <p className={styles.tagline}>{taglineText}</p>
        </div>
        <SignIn />
      </main>
    </div>
  );
}
