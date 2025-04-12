import { ensureSession } from "@/utils/supabase/supabase";
import AppButton from "../AppButton";
import { Text } from "react-native";
import Purchases from "react-native-purchases";

export default function TestPurchase() {
  return (
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
      className="w-[363] h-[72] mb-4 overflow-hidden self-center mt-4"
      style={{}}>
      <Text className="text-black text-lg font-bold font-['Poppins'] w-auto">Test Purchase</Text>
    </AppButton>
  );
}
