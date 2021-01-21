import * as assert from 'assert';
import { IMock, Mock, Times } from 'typemoq';
import { DateTime } from '../../core/date-time';
import { FileSystem } from '../../core/io/file-system';
import { Logger } from '../../core/logger';
import { AlbumKeyGenerator } from '../../data/album-key-generator';
import { Track } from '../../data/entities/track';
import { FileMetadataFactory } from '../../metadata/file-metadata-factory';
import { FileMetadataMock } from '../../metadata/file-metadata-mock';
import { MimeTypes } from '../../metadata/mime-types';
import { TrackFieldCreator } from './track-field-creator';
import { TrackFiller } from './track-filler';

describe('TrackFiller', () => {
    let fileMetadataFactoryMock: IMock<FileMetadataFactory>;
    let trackFieldCreatorMock: IMock<TrackFieldCreator>;
    let albumKeyGeneratorMock: IMock<AlbumKeyGenerator>;
    let fileSystemMock: IMock<FileSystem>;
    let mimeTypesMock: IMock<MimeTypes>;
    let loggerMock: IMock<Logger>;

    let trackFiller: TrackFiller;

    beforeEach(() => {
        fileMetadataFactoryMock = Mock.ofType<FileMetadataFactory>();
        trackFieldCreatorMock = Mock.ofType<TrackFieldCreator>();
        albumKeyGeneratorMock = Mock.ofType<AlbumKeyGenerator>();
        fileSystemMock = Mock.ofType<FileSystem>();
        mimeTypesMock = Mock.ofType<MimeTypes>();
        loggerMock = Mock.ofType<Logger>();

        trackFieldCreatorMock.setup((x) => x.createMultiTextField(['Artist 1', 'Artist 2'])).returns(() => ';Artist 1;;Artist 2;');
        trackFieldCreatorMock.setup((x) => x.createMultiTextField(['Genre 1', 'Genre 2'])).returns(() => ';Genre 1;;Genre 2;');
        trackFieldCreatorMock.setup((x) => x.createTextField('Album title')).returns(() => 'Album title');
        trackFieldCreatorMock.setup((x) => x.createNumberField(320)).returns(() => 320);
        trackFieldCreatorMock.setup((x) => x.createNumberField(44)).returns(() => 44);
        trackFieldCreatorMock.setup((x) => x.createTextField('Track title')).returns(() => 'Track title');
        trackFieldCreatorMock.setup((x) => x.createNumberField(1)).returns(() => 1);
        trackFieldCreatorMock.setup((x) => x.createNumberField(2)).returns(() => 2);
        trackFieldCreatorMock.setup((x) => x.createNumberField(4)).returns(() => 4);
        trackFieldCreatorMock.setup((x) => x.createNumberField(15)).returns(() => 15);
        trackFieldCreatorMock.setup((x) => x.createNumberField(123456)).returns(() => 123456);
        trackFieldCreatorMock.setup((x) => x.createNumberField(2020)).returns(() => 2020);

        trackFieldCreatorMock
            .setup((x) => x.createMultiTextField(['Album artist 1', 'Album artist 2']))
            .returns(() => ';Album artist 1;;Album artist 2;');

        albumKeyGeneratorMock
            .setup((x) => x.generateAlbumKey('Album title', ['Album artist 1', 'Album artist 2']))
            .returns(() => ';Album title;;Album artist 1;;Album artist 2;');

        mimeTypesMock.setup((x) => x.getMimeTypeForFileExtension('.mp3')).returns(() => 'audio/mpeg');

        fileSystemMock.setup((x) => x.getFileName('/home/user/Music/Track 1.mp3')).returns(() => 'Track 1');
        fileSystemMock.setup((x) => x.getFileExtension('/home/user/Music/Track 1.mp3')).returns(() => '.mp3');
        fileSystemMock.setup((x) => x.getFilesizeInBytesAsync('/home/user/Music/Track 1.mp3')).returns(async () => 123);
        fileSystemMock.setup((x) => x.getDateCreatedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 456);

        trackFiller = new TrackFiller(
            fileMetadataFactoryMock.object,
            trackFieldCreatorMock.object,
            albumKeyGeneratorMock.object,
            fileSystemMock.object,
            mimeTypesMock.object,
            loggerMock.object
        );
    });

    describe('addFileMetadataToTrackAsync', () => {
        it('should fill in track artists with a multi value track field', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.artists = ['Artist 1', 'Artist 2'];

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createMultiTextField(fileMetadataMock.artists), Times.exactly(1));
            assert.strictEqual(track.artists, ';Artist 1;;Artist 2;');
        });

        it('should fill in track genres with a multi value track field', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.genres = ['Genre 1', 'Genre 2'];

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createMultiTextField(fileMetadataMock.genres), Times.exactly(1));
            assert.strictEqual(track.genres, ';Genre 1;;Genre 2;');
        });

        it('should fill in track albumTitle with a single value track field', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.album = 'Album title';

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createTextField(fileMetadataMock.album), Times.exactly(1));
            assert.strictEqual(track.albumTitle, 'Album title');
        });

        it('should fill in track albumArtists with a multi value track field', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.albumArtists = ['Album artist 1', 'Album artist 2'];

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createMultiTextField(fileMetadataMock.albumArtists), Times.exactly(1));
            assert.strictEqual(track.albumArtists, ';Album artist 1;;Album artist 2;');
        });

        it('should fill in track albumKey with a generated album key', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.album = 'Album title';
            fileMetadataMock.albumArtists = ['Album artist 1', 'Album artist 2'];

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            albumKeyGeneratorMock.verify((x) => x.generateAlbumKey('Album title', ['Album artist 1', 'Album artist 2']), Times.exactly(1));
            assert.strictEqual(track.albumKey, ';Album title;;Album artist 1;;Album artist 2;');
        });

        it('should fill in track fileName with the file name of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            fileSystemMock.verify((x) => x.getFileName('/home/user/Music/Track 1.mp3'), Times.exactly(1));
            assert.strictEqual(track.fileName, 'Track 1');
        });

        it('should fill in track mimeType with the mime type of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            fileSystemMock.verify((x) => x.getFileExtension('/home/user/Music/Track 1.mp3'), Times.exactly(1));
            mimeTypesMock.verify((x) => x.getMimeTypeForFileExtension('.mp3'), Times.exactly(1));
            assert.strictEqual(track.mimeType, 'audio/mpeg');
        });

        it('should fill in track fileSize with the file size of the audio file in bytes', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            fileSystemMock.verify((x) => x.getFilesizeInBytesAsync('/home/user/Music/Track 1.mp3'), Times.exactly(1));

            assert.strictEqual(track.fileSize, 123);
        });

        it('should fill in track bitRate with the bit rate of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.bitRate = 320;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(320), Times.exactly(1));
            assert.strictEqual(track.bitRate, 320);
        });

        it('should fill in track sampleRate with the sample rate of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.sampleRate = 44;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(44), Times.exactly(1));
            assert.strictEqual(track.sampleRate, 44);
        });

        it('should fill in track trackTitle with a single value track field', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.title = 'Track title';

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createTextField(fileMetadataMock.title), Times.exactly(1));
            assert.strictEqual(track.trackTitle, 'Track title');
        });

        it('should fill in track trackNumber with the track number of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.trackNumber = 1;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(1), Times.exactly(1));
            assert.strictEqual(track.trackNumber, 1);
        });

        it('should fill in track trackCount with the track count of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.trackCount = 15;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(15), Times.exactly(1));
            assert.strictEqual(track.trackCount, 15);
        });

        it('should fill in track discNumber with the disc number of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.discNumber = 1;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(1), Times.exactly(1));
            assert.strictEqual(track.discNumber, 1);
        });

        it('should fill in track discCount with the disc count of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.discCount = 2;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(2), Times.exactly(1));
            assert.strictEqual(track.discCount, 2);
        });

        it('should fill in track duration with the duration of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.duration = 123456;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(123456), Times.exactly(1));
            assert.strictEqual(track.duration, 123456);
        });

        it('should fill in track year with the year of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.year = 2020;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(2020), Times.exactly(1));
            assert.strictEqual(track.year, 2020);
        });

        it('should fill in track hasLyrics with 0 if the audio file lyrics are undefined', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.lyrics = undefined;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.hasLyrics, 0);
        });

        it('should fill in track hasLyrics with 0 if the audio file lyrics are empty', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.lyrics = '';

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.hasLyrics, 0);
        });

        it('should fill in track hasLyrics with 0 if the audio file lyrics are not empty', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.lyrics = 'Blabla';

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.hasLyrics, 1);
        });

        it('should fill in track dateAdded wit hthe current date and time in ticks', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            const dateTicksBefore: number = DateTime.getTicks(new Date());
            await trackFiller.addFileMetadataToTrackAsync(track);
            const dateTicksAfter: number = DateTime.getTicks(new Date());

            // Assert
            assert.ok(track.dateAdded >= dateTicksBefore && track.dateAdded <= dateTicksAfter);
        });

        it('should fill in track dateFileCreated with the date that the file was created in ticks', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Asser
            assert.strictEqual(track.dateFileCreated, 456);
        });

        it('should fill in track dateLastSynced wit hthe current date and time in ticks', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            const dateTicksBefore: number = DateTime.getTicks(new Date());
            await trackFiller.addFileMetadataToTrackAsync(track);
            const dateTicksAfter: number = DateTime.getTicks(new Date());

            // Assert
            assert.ok(track.dateLastSynced >= dateTicksBefore && track.dateLastSynced <= dateTicksAfter);
        });

        it('should fill in track dateFileModified with the date that the file was modified in ticks', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Asser
            assert.strictEqual(track.dateFileModified, 789);
        });

        it('should fill in track needsIndexing with 0', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Asser
            assert.strictEqual(track.needsIndexing, 0);
        });

        it('should fill in track needsAlbumArtworkIndexing with 1', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Asser
            assert.strictEqual(track.needsAlbumArtworkIndexing, 1);
        });

        it('should fill in track rating with the rating of the audio file', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();
            fileMetadataMock.rating = 4;

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            trackFieldCreatorMock.verify((x) => x.createNumberField(4), Times.exactly(1));
            assert.strictEqual(track.rating, 4);
        });

        it('should fill in track indexingSuccess with 1 if no errors occur', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.indexingSuccess, 1);
        });

        it('should fill in an empty track indexingFailureReason if no errors occur', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).returns(async () => 789);

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.indexingFailureReason, '');
        });

        it('should fill in track indexingSuccess with 0 if errors occur', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).throws(new Error('The error text'));

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.indexingSuccess, 0);
        });

        it('should fill in track indexingFailureReason with the error text if an error occur', async () => {
            // Arrange
            const fileMetadataMock: FileMetadataMock = new FileMetadataMock();

            fileMetadataFactoryMock
                .setup((x) => x.createReadOnlyAsync('/home/user/Music/Track 1.mp3'))
                .returns(async () => fileMetadataMock);
            fileSystemMock.setup((x) => x.getDateModifiedInTicksAsync('/home/user/Music/Track 1.mp3')).throws(new Error('The error text'));

            // Act
            const track: Track = new Track('/home/user/Music/Track 1.mp3');
            await trackFiller.addFileMetadataToTrackAsync(track);

            // Assert
            assert.strictEqual(track.indexingFailureReason, 'The error text');
        });
    });
});