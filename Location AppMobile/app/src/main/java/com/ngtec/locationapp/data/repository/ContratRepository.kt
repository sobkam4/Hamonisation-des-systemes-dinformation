package com.ngtec.locationapp.data.repository

import com.ngtec.locationapp.data.local.dao.ContratDao
import com.ngtec.locationapp.data.mapper.toDomain
import com.ngtec.locationapp.data.mapper.toEntity
import com.ngtec.locationapp.data.remote.api.ContratApiService
import com.ngtec.locationapp.data.remote.dto.ContratCreateRequest
import com.ngtec.locationapp.domain.model.Contrat
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class ContratRepository @Inject constructor(
    private val contratApiService: ContratApiService,
    private val contratDao: ContratDao
) {
    fun observeContrats(): Flow<List<Contrat>> = contratDao.observeAll().map { items ->
        items.map { entity -> entity.toDomain() }
    }

    suspend fun refreshContrats() {
        val remoteItems = contratApiService.getContrats()
        contratDao.clearAll()
        contratDao.insertAll(remoteItems.map { dto -> dto.toEntity() })
    }

    suspend fun createContrat(
        clientId: Long,
        bienId: Long,
        dateDebut: String,
        dateFin: String,
        montantMensuel: Double,
        caution: Double,
        statut: String
    ): Contrat {
        val created = contratApiService.createContrat(
            request = ContratCreateRequest(
                client = clientId,
                bien = bienId,
                dateDebut = dateDebut,
                dateFin = dateFin,
                montantMensuel = montantMensuel,
                caution = caution,
                statut = statut
            )
        )
        val entity = created.toEntity()
        contratDao.insertAll(listOf(entity))
        return entity.toDomain()
    }

    suspend fun deleteContrat(id: Long) {
        contratApiService.deleteContrat(id)
        contratDao.deleteById(id)
    }
}
