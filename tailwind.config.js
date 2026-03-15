/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/mainview/**/*.{html,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				neutral: {
					50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
					100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
					200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
					300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
					400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
					500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
					600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
					700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
					800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
					900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
					950: 'rgb(var(--color-neutral-950) / <alpha-value>)',
				},
				emerald: {
					50: 'rgb(var(--color-accent-50) / <alpha-value>)',
					100: 'rgb(var(--color-accent-100) / <alpha-value>)',
					200: 'rgb(var(--color-accent-200) / <alpha-value>)',
					300: 'rgb(var(--color-accent-300) / <alpha-value>)',
					400: 'rgb(var(--color-accent-400) / <alpha-value>)',
					500: 'rgb(var(--color-accent-500) / <alpha-value>)',
					600: 'rgb(var(--color-accent-600) / <alpha-value>)',
					700: 'rgb(var(--color-accent-700) / <alpha-value>)',
					800: 'rgb(var(--color-accent-800) / <alpha-value>)',
					900: 'rgb(var(--color-accent-900) / <alpha-value>)',
					950: 'rgb(var(--color-accent-950) / <alpha-value>)',
				}
			}
		},
	},
	plugins: [],
};
