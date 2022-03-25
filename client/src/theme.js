import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    /*palette: {
      primary: {
        main: '#000',
      },
      secondary: {
        main: '#fff',
      },
      // whatever colors you want to include
      // Please refer to the following for more details
      // https://mui.com/customization/default-theme/#explore
    },*/
    palette: {
        mode: "dark",
    },
    component: {
        typography: {
            styleOverrides: {
                root: {
                    fontFamily: "Roboto",
                },
            },
            /*chip: {
        root: {
          backgroundColor: someColor
          // color props should work color="primary" and be applied the primary color #000
        }
      }*/
        },
    },
});
