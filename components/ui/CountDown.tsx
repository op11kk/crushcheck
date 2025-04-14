import React from "react";
import { Text, View } from "react-native";
import * as Application from "expo-application";

const TIME_LIMIT = 1 * 60 * 60 * 1000;
export default function CountDown() {
  const [countdown, setCountdown] = React.useState(0);
  const minutes = Math.floor(countdown / 1000 / 60);
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const seconds = Math.floor((countdown % (1000 * 60)) / 1000);
  const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    async function startCountdown() {
      const installationTime = await Application.getInstallationTimeAsync();
      timer = setInterval(() => {
        setCountdown(TIME_LIMIT - ((Date.now() - installationTime.getTime()) % TIME_LIMIT));
      }, 1000);
    }
    startCountdown();
    return () => {
      clearInterval(timer);
    };
  }, []);
  return (
    <View className="flex-row items-center justify-center">
      {`${minutesStr}:${secondsStr}`.split("").map((item, index) => (
        <View
          className="justify-center items-center"
          style={{
            shadowColor: "rgba(99, 152, 188, 0.06)",
            shadowOffset: {
              width: 0,
              height: 2
            },
            shadowRadius: 3,
            elevation: 3,
            shadowOpacity: 1,
            borderRadius: 6,
            backgroundColor: "#fff",
            borderStyle: "solid",
            borderColor: "rgba(132, 132, 132, 1)",
            borderWidth: isNaN(Number(item)) ? 0 : 1,
            width: 35,
            height: 45,
            overflow: "hidden",
            marginBottom: index === 2 ? 4 : 0,
            marginLeft: [0, 2, 3].includes(index) ? 0 : 6
          }}>
          <Text className="text-zinc-500 text-lg font-normal font-['Impact']">{item}</Text>
        </View>
      ))}
    </View>
  );
}
