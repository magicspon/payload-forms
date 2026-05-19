import './globals.css'

export default function RootLayer({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head><title>@spon/payload-forms</title></head>
			<body>{children}</body>
		</html>
	)
}
