import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

/**
 * Formats a numeric-string count into a display label, e.g. formatCountLabel('4', 'Seater', 'Seater') -> "4 Seater",
 * formatCountLabel('1', 'large bag', 'large bags') -> "1 large bag". Non-numeric input is returned unchanged.
 */
export const formatCountLabel = (value, singular, plural) => {
	const cleanValue = String(value ?? '').trim();
	if (!/^\d+$/.test(cleanValue)) return cleanValue;

	return `${cleanValue} ${Number(cleanValue) === 1 ? singular : plural}`;
};

/** Extracts the first number found anywhere in a label, e.g. "4 Seater" -> "4", "SGD 120 per trip" -> "120". Returns '' if none found. */
export const extractCount = (value) => (String(value ?? '').match(/[\d.]+/) || [''])[0];

/** Formats a numeric-string amount into a fare label, e.g. formatRateLabel('120') -> "SGD 120 per trip". Empty input returns ''. */
export const formatRateLabel = (value) => {
	const cleanValue = String(value ?? '').trim();
	return cleanValue ? `SGD ${cleanValue} per trip` : '';
};

/**
 * Computes a driver account's renewal countdown relative to `now`.
 * Pass a live-ticking `now` value (e.g. from a setInterval-driven state) to keep the result fresh without a page reload.
 */
export const calculateRenewalTimer = (expiresAt, now = new Date()) => {
	if (!expiresAt) return { daysRemaining: null, text: 'No timer set', status: 'normal' };

	const expiry = new Date(expiresAt);
	const diffTime = expiry.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays < 0) {
		return {
			daysRemaining: diffDays,
			text: `EXPIRED (${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago)`,
			status: 'expired',
		};
	}

	if (diffDays <= 30) {
		return {
			daysRemaining: diffDays,
			text: `Due Soon (${diffDays} ${diffDays === 1 ? 'day' : 'days'} left)`,
			status: 'warning',
		};
	}

	return {
		daysRemaining: diffDays,
		text: `${diffDays} days remaining`,
		status: 'active',
	};
};
