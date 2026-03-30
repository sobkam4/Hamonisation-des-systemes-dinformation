package com.ngtec.locationapp.data.repository

import com.ngtec.locationapp.data.local.dao.BienDao
import com.ngtec.locationapp.data.mapper.toDomain
import com.ngtec.locationapp.data.mapper.toEntity
import com.ngtec.locationapp.data.remote.api.BienApiService
import com.ngtec.locationapp.data.remote.dto.BienCreateRequest
import com.ngtec.locationapp.domain.model.Bien
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class BienRepository @Inject constructor(
    private val bienApiService: BienApiService,
    private val bienDao: BienDao
) {
    fun observeBiens(): Flow<List<Bien>> = bienDao.observeAll().map { items ->
        items.map { entity -> entity.toDomain() }
    }

    suspend fun refreshBiens() {
        val remoteItems = bienApiService.getBiens()
        bienDao.clearAll()
        bienDao.insertAll(remoteItems.map { dto -> dto.toEntity() })
    }

    suspend fun createBien(
        nom: String,
        typeBien: String,
        statut: String,
        montantMensuel: Double,
        adresse: String
    ): Bien {
        val created = bienApiService.createBien(
            request = BienCreateRequest(
                nom = nom,
                typeBien = typeBien,
                statut = statut,
                montantMensuel = montantMensuel,
                adresse = adresse
            )
        )
        val entity = created.toEntity()
        bienDao.insertAll(listOf(entity))
        return entity.toDomain()
    }

    suspend fun deleteBien(id: Long) {
        bienApiService.deleteBien(id)
        bienDao.deleteById(id)
    }
}
