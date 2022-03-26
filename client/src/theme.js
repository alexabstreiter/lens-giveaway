import { createTheme } from "@mui/material/styles";

const font = "'Roboto Mono', monospace";

export const theme = createTheme({
    palette: {
        mode: "dark",
    },
    typography: {
        fontFamily: font,
        styleOverrides: {
            root: {
                fontFamily: font,
            },
        },
    },
});
