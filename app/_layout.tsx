import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import DatabaseService from "@/services/database/db";
import { SQLITE_DB_NAME } from "@/utils/config";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import React from "react";

const RootLayout = () => {
  return (
    <SQLiteProvider
      databaseName={SQLITE_DB_NAME}
      onInit={async (db) => {
        const dbService = DatabaseService.getInstance();
        dbService.setDatabase(db);
        await dbService.initialize();
        // await dbService.migrateToVersion(1)
        console.log(`Database initialization completed.`);
      }}
    >
      <GluestackUIProvider mode="light">
        <Stack
          screenOptions={{
            headerShown: false,
            headerBackVisible: false,
          }}
        />
      </GluestackUIProvider>
    </SQLiteProvider>
  );
};

export default RootLayout;
