interface Props {
  referralLink: string;
}

export default function EmailTemplate({
  referralLink,
}: Props) {
  return (
    <div
      style={{
        fontFamily: "Arial",
        padding: "40px",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
        }}
      >
        <h2>Join PropChain</h2>

        <p>
          I invited you to join PropChain.
        </p>

        <a href={referralLink}>
          Accept Invitation
        </a>
      </div>
    </div>
  );
}