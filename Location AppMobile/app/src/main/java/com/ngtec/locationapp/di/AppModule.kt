package com.ngtec.locationapp.di

import android.content.Context
import androidx.room.Room
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.ngtec.locationapp.BuildConfig
import com.ngtec.locationapp.data.local.dao.BienDao
import com.ngtec.locationapp.data.local.dao.ClientDao
import com.ngtec.locationapp.data.local.dao.ContratDao
import com.ngtec.locationapp.data.local.dao.DepenseDao
import com.ngtec.locationapp.data.local.dao.PaiementDao
import com.ngtec.locationapp.data.local.db.AppDatabase
import com.ngtec.locationapp.data.remote.AuthTokenInterceptor
import com.ngtec.locationapp.data.remote.api.AuthApiService
import com.ngtec.locationapp.data.remote.api.BienApiService
import com.ngtec.locationapp.data.remote.api.ClientApiService
import com.ngtec.locationapp.data.remote.api.ContratApiService
import com.ngtec.locationapp.data.remote.api.DepenseApiService
import com.ngtec.locationapp.data.remote.api.PaiementApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authTokenInterceptor: AuthTokenInterceptor,
        loggingInterceptor: HttpLoggingInterceptor
    ): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authTokenInterceptor)
        .addInterceptor(loggingInterceptor)
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    @Provides
    @Singleton
    fun provideAuthApiService(retrofit: Retrofit): AuthApiService =
        retrofit.create(AuthApiService::class.java)

    @Provides
    @Singleton
    fun provideBienApiService(retrofit: Retrofit): BienApiService =
        retrofit.create(BienApiService::class.java)

    @Provides
    @Singleton
    fun provideClientApiService(retrofit: Retrofit): ClientApiService =
        retrofit.create(ClientApiService::class.java)

    @Provides
    @Singleton
    fun provideContratApiService(retrofit: Retrofit): ContratApiService =
        retrofit.create(ContratApiService::class.java)

    @Provides
    @Singleton
    fun providePaiementApiService(retrofit: Retrofit): PaiementApiService =
        retrofit.create(PaiementApiService::class.java)

    @Provides
    @Singleton
    fun provideDepenseApiService(retrofit: Retrofit): DepenseApiService =
        retrofit.create(DepenseApiService::class.java)

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): AppDatabase = Room.databaseBuilder(
        context,
        AppDatabase::class.java,
        "location_app.db"
    ).fallbackToDestructiveMigration().build()

    @Provides
    fun provideBienDao(database: AppDatabase): BienDao = database.bienDao()

    @Provides
    fun provideClientDao(database: AppDatabase): ClientDao = database.clientDao()

    @Provides
    fun provideContratDao(database: AppDatabase): ContratDao = database.contratDao()

    @Provides
    fun providePaiementDao(database: AppDatabase): PaiementDao = database.paiementDao()

    @Provides
    fun provideDepenseDao(database: AppDatabase): DepenseDao = database.depenseDao()
}
