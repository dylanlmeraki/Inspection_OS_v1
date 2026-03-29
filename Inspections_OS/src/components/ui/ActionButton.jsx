export default function ActionButton({
  children,
  onClick,
  disabled = false,
  variant = "default",
  ...buttonProps
}) {
  const className =
    variant === "primary"
      ? "btn primary"
      : variant === "warn"
      ? "btn warn"
      : "btn";
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
