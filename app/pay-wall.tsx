import { View, Text, Button, Dimensions } from "react-native";
import React, { useRef } from "react";
import { useHeaderHeight } from "@react-navigation/elements";
import { Stack, useNavigation } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Image, ImageBackground } from "expo-image";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import AppButton from "@/components/AppButton";
import { ensureSession } from "@/utils/supabase/supabase";
import Purchases from "react-native-purchases";
import CountDown from "@/components/ui/CountDown";

const banners = [require("@/assets/images/pay-wall/crush.svg"), require("@/assets/images/pay-wall/redflag.png")];

export default function PayWall() {
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const window = Dimensions.get("window");
  const textCarouselRef = useRef<ICarouselInstance>(null);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AppButton className="w-11 h-11 justify-center items-center bg-white rounded-full" onPress={() => navigation.goBack()}>
          <SymbolView
            weight="regular"
            tintColor="black"
            resizeMode="scaleAspectFit"
            name="xmark"
            style={[
              {
                width: 16,
                height: 16
              }
            ]}
          />
        </AppButton>
      ),
      headerLeft: () => (
        <Text className="justify-center text-black/80 text-2xl font-medium font-['Poppins']" style={{}}>
          One time offer
        </Text>
      )
    });
  }, []);
  const progress = useSharedValue<number>(0);
  const ref = React.useRef<ICarouselInstance>(null);
  const bannerHeight = (204 * window.width) / 350;
  const bannerWidth = window.width;

  const indicatorDotSize = 8; // 61000 1 1

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: "" }} />
      <View className=" w-full" style={{ height: headerHeight }} />
      <View className="w-full flex-row items-center justify-center mt-6 h-[36]">
        <Text className="text-zinc-800 text-2xl font-normal font-['Poppins'] h-[36] self-center">Uncover his/her</Text>
        <Carousel
          ref={textCarouselRef}
          data={[" crush level", " 🚩Redflag"]}
          height={36}
          loop={true}
          pagingEnabled={true}
          snapEnabled={true}
          width={120}
          style={{
            width: 120
          }}
          vertical={true}
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50
          }}
          renderItem={({ item }) => {
            return <Text className="text-zinc-800 text-2xl font-normal font-['Poppins']">{item}</Text>;
          }}
        />
      </View>

      <View id="carousel-component">
        <Carousel
          autoPlayInterval={3000}
          data={banners}
          height={bannerHeight}
          loop={true}
          pagingEnabled={true}
          snapEnabled={true}
          width={window.width}
          style={{
            width: window.width
          }}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50
          }}
          autoPlay={true}
          onSnapToItem={index => {
            const textIndex = index % 2;
            textCarouselRef.current?.scrollTo({ index: textIndex, animated: true });
          }}
          renderItem={({ item }) => {
            return (
              <View
                className={`w-[${bannerWidth}] h-[${bannerHeight}] bg-white/80 rounded-[20px] overflow-hidden shadow-[inset_1px_-2px_2px_0px_rgba(0,0,0,0.08)] shadow-[inset_0px_1px_2px_0px_rgba(0,0,0,0.15)] self-center`}>
                <Image source={item} style={{ width: bannerWidth, height: bannerHeight }} />
              </View>
            );
          }}
        />
        <View className="self-center">
          <View className="flex-row items-center justify-center">
            {banners.map((item, index) => (
              <View
                key={item}
                className="bg-zinc-400 rounded-3xl"
                style={{ width: indicatorDotSize, height: indicatorDotSize, marginLeft: index === 0 ? 0 : indicatorDotSize }}
              />
            ))}
          </View>
          <Animated.View
            className="bg-white rounded-3xl absolute left-0"
            style={[
              { width: indicatorDotSize, height: indicatorDotSize },
              useAnimatedStyle(() => ({
                transform: [
                  {
                    translateX: progress.value * (2 * indicatorDotSize)
                  }
                ]
              }))
            ]}
          />
        </View>
        <ImageBackground source={require("@/assets/images/pay-wall/bg.svg")} className="w-[368] h-[296] self-center mt-10">
          <View className="w-20 h-8 bg-rose-100 rounded-xl overflow-hidden absolute -top-4 self-center">
            <Text className="left-[15px] top-[5px] absolute justify-center text-black text-base font-medium font-['Poppins']">80%off</Text>
          </View>
          <View className="flex-row items-center justify-center mt-10">
            <Text className="text-zinc-800 text-xl font-medium font-['Poppins']">Only </Text>
            <Text className="text-red-400 text-3xl font-medium font-['Poppins']">$</Text>
            <Text className="text-red-400 text-3xl font-normal font-['Impact']">3.99</Text>
            <Text className="text-zinc-800 text-xl font-medium font-['Poppins']">/week </Text>
          </View>
          <View className="flex-row self-center flex-1 justify-center items-center">
            <View>
              <View className="flex-row items-center justify-center">
                <CountDown />
              </View>
              <Text className="text-center justify-center text-black text-xl font-medium font-['Poppins'] absolute -top-3 -left-3">⏰</Text>
            </View>
          </View>
          <AppButton
            onPress={async () => {
              try {
                await ensureSession();
                const products = await Purchases.getProducts(["crushsign_weekly_399"]);
                console.log(products);
                const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
                if (typeof customerInfo.entitlements.active["Pro"] !== "undefined") {
                  // Unlock that great "pro" content
                }
              } catch (e) {
                if (!e.userCancelled) {
                  console.log("Error purchasing product:", e);
                }
              }
            }}
            className="w-[329] h-[97] self-center mb-8">
            <Image source={require("@/assets/images/pay-wall/button.png")} className="w-[329] h-[97]" />
          </AppButton>
        </ImageBackground>
      </View>
    </View>
  );
}
