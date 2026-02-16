'use client';

import styles from './GradientButton.module.css';

export default function GradientButton({
    title,
    onClick,
    loading = false,
    disabled = false,
    style,
    className = '',
    type = 'button',
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${styles.button} ${disabled ? styles.disabled : ''} ${className}`}
            style={style}
        >
            {loading ? (
                <span className={styles.spinner} />
            ) : (
                title
            )}
        </button>
    );
}
